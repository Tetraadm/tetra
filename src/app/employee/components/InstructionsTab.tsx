'use client'

import { Search, FileText } from 'lucide-react'
import type { Instruction } from '@/lib/types'
import { severityLabel } from '@/lib/ui-helpers'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"


type Props = {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredInstructions: Instruction[]
  onSelectInstruction: (instruction: Instruction) => void
}

export default function InstructionsTab({
  searchQuery,
  setSearchQuery,
  filteredInstructions,
  onSelectInstruction
}: Props) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk i instrukser..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      {filteredInstructions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border rounded-lg bg-muted/5">
          <FileText className="h-12 w-12 mb-4 opacity-50" />
          <h3 className="font-semibold text-lg mb-2">
            {searchQuery ? 'Ingen treff' : 'Ingen instrukser tilgjengelig'}
          </h3>
          <p className="max-w-sm text-sm mb-4">
            {searchQuery
              ? 'Prøv å søke med et annet nøkkelord eller fjern søket for å se alle instrukser.'
              : 'Det er ingen instrukser tildelt deg for øyeblikket.'}
          </p>
          {searchQuery && (
            <Badge variant="outline" className="cursor-pointer hover:bg-secondary/80" onClick={() => setSearchQuery('')}>
              Fjern søk
            </Badge>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {filteredInstructions.map(inst => (
              <div
                key={inst.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onSelectInstruction(inst)}
              >
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium mb-1 truncate text-foreground">
                    {inst.title}
                  </div>
                  <Badge variant={inst.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {severityLabel(inst.severity)}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
