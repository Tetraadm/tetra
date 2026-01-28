/**
 * Initializes GoogleAuth client using credentials from environment variables.
 * Prioritizes GOOGLE_CREDENTIALS_JSON which allows putting the whole JSON key in one env var.
 */
export function getGoogleAuthOptions() {
  const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON

  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson)
      return {
        credentials,
        projectId: credentials.project_id
      }
    } catch (e) {
      console.error('Failed to parse GOOGLE_CREDENTIALS_JSON', e)
      throw new Error('Invalid GOOGLE_CREDENTIALS_JSON format')
    }
  }

  // Fallback to standard Google application default credentials (ADC)
  // This works if GOOGLE_APPLICATION_CREDENTIALS path is set, or on GCloud environment
  return {}
}

export function getProjectId(): string {
    const options = getGoogleAuthOptions()
    if (options.projectId) return options.projectId
    
    if (process.env.GOOGLE_CLOUD_PROJECT) {
      return process.env.GOOGLE_CLOUD_PROJECT
    }
    
    throw new Error('GOOGLE_CLOUD_PROJECT not configured and not found in credentials')
}
