import { v1 } from '@google-cloud/discoveryengine'
import { getGoogleAuthOptions, getProjectId } from './vertex-auth'
import { getCachedSearchResults, cacheSearchResults } from './cache'
import { aiLogger, createTimer } from './logger'

const { SearchServiceClient } = v1

// Configuration
const LOCATION = 'global'
const DATA_STORE_ID = process.env.VERTEX_DATA_STORE_ID
const SEARCH_APP_ID = process.env.VERTEX_SEARCH_APP_ID
const ENABLE_SEARCH_CACHE = process.env.ENABLE_SEARCH_CACHE !== 'false' // Default enabled

// Reusable client (connection pooling)
let searchClient: InstanceType<typeof SearchServiceClient> | null = null

function getSearchClient(): InstanceType<typeof SearchServiceClient> {
    if (!searchClient) {
        searchClient = new SearchServiceClient(getGoogleAuthOptions())
    }
    return searchClient
}

export type VertexSearchResult = {
    id: string
    title: string
    content: string
    link?: string
    score: number
}

type ProtobufValue = {
    stringValue?: string
    numberValue?: number
    boolValue?: boolean
    listValue?: { values?: ProtobufValue[] }
    structValue?: ProtobufStruct
}

type ProtobufStruct = {
    fields?: Record<string, ProtobufValue>
}

type ParsedStruct = Record<string, unknown>

type SearchDocument = {
    name?: string
    uri?: string
    structData?: ProtobufStruct
    derivedStructData?: ProtobufStruct
}

type SearchResultItem = {
    id?: string
    document?: SearchDocument
}

type SearchResponse = {
    results?: SearchResultItem[]
}

export async function searchDocuments(
    query: string, 
    limit: number = 5,
    orgId?: string
): Promise<VertexSearchResult[]> {
    const timer = createTimer(aiLogger, 'vertex_search')
    
    // Check cache first
    if (ENABLE_SEARCH_CACHE) {
        const cached = await getCachedSearchResults<VertexSearchResult[]>(query, orgId)
        if (cached) {
            timer.end({ source: 'cache', count: cached.length })
            return cached
        }
    }

    const projectId = getProjectId()
    const client = getSearchClient()

    let servingConfig = ''

    if (SEARCH_APP_ID) {
        servingConfig = `projects/${projectId}/locations/${LOCATION}/collections/default_collection/engines/${SEARCH_APP_ID}/servingConfigs/default_search`
    } else {
        servingConfig = client.projectLocationCollectionDataStoreServingConfigPath(
            projectId,
            LOCATION,
            'default_collection',
            DATA_STORE_ID || 'tetrivo-documents-connector',
            'default_search'
        )
    }

    try {
        const [response] = await client.search({
            servingConfig,
            query: query,
            pageSize: limit,
            contentSearchSpec: {
                snippetSpec: { returnSnippet: true },
                summarySpec: { summaryResultCount: 1, includeCitations: true },
                extractiveContentSpec: { maxExtractiveAnswerCount: 1 }
            }
        })

        const results = (response as SearchResponse).results ?? []

        if (process.env.NODE_ENV === 'development') {
            aiLogger.debug({
                query,
                resultsCount: results.length,
                firstResultId: results[0]?.id
            }, 'Vertex search completed')
        }

        if (!results || results.length === 0) {
            aiLogger.debug({ query }, 'No results found')
            timer.end({ source: 'api', count: 0 })
            return []
        }

        const mappedResults = results.map((result, index) => {
            const rawData = result.document?.structData ?? result.document?.derivedStructData
            const data = parseStruct(rawData)

            const title = getString(data?.title) || (result.document?.name?.split('/').pop()) || 'Uten navn'

            const snippets = getArray(data?.snippets)
            const snippetContent = getStringField(snippets[0], 'snippet') || ''
            const extractiveAnswers = getArray(data?.extractive_answers)
            const extractiveContent = getStringField(extractiveAnswers[0], 'content') || ''
            const content = extractiveContent || snippetContent || getString(data?.text) || ''

            const link = getString(data?.link) ||
                         getString(data?.uri) ||
                         result.document?.uri ||
                         ''

            return {
                id: result.id || `vertex-${index}`,
                title,
                content: content.replace(/<b>/g, '').replace(/<\/b>/g, ''),
                link,
                score: 0.9 - (index * 0.1)
            }
        })

        // Cache results
        if (ENABLE_SEARCH_CACHE) {
            await cacheSearchResults(query, mappedResults, orgId)
        }

        timer.end({ source: 'api', count: mappedResults.length })
        return mappedResults

    } catch (error) {
        timer.fail(error, { query })
        return []
    }
}

function getString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined
}

function getArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : []
}

function getStringField(value: unknown, key: string): string | undefined {
    if (!value || typeof value !== 'object') {
        return undefined
    }
    const record = value as Record<string, unknown>
    return getString(record[key])
}

function isStruct(value: unknown): value is ProtobufStruct {
    return !!value && typeof value === 'object' && 'fields' in value
}

/**
 * Helper to parse Google Protobuf Structs (returned by Discovery Engine)
 * into plain JavaScript objects.
 */
function parseStruct(struct: unknown): ParsedStruct | undefined {
    if (!isStruct(struct) || !struct.fields) return undefined
    const result: ParsedStruct = {}
    for (const key in struct.fields) {
        result[key] = parseValue(struct.fields[key])
    }
    return result
}

function parseValue(value: ProtobufValue | undefined): unknown {
    if (!value) return null
    if (typeof value.stringValue === 'string') return value.stringValue
    if (typeof value.numberValue === 'number') return value.numberValue
    if (typeof value.boolValue === 'boolean') return value.boolValue
    if (value.listValue?.values) {
        return value.listValue.values.map((entry) => parseValue(entry))
    }
    if (value.structValue) {
        return parseStruct(value.structValue)
    }
    return null
}
