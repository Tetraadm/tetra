'use client'

import {
  AlertTriangle,
  FileText,
  MessageCircle,
  Zap,
  Clock,
  Inbox
} from 'lucide-react'
import type { Alert, Instruction } from '@/lib/types'
import { severityLabel } from '@/lib/ui-helpers'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Props = {
  alerts: Alert[]
  instructions: Instruction[]
  criticalInstructions: Instruction[]
  isMobile: boolean
  onTabChange: (tab: 'instructions' | 'ask') => void
  onSelectInstruction: (instruction: Instruction) => void
  setSearchQuery: (query: string) => void
}

export default function HomeContent({
  alerts,
  instructions,
  criticalInstructions,
  isMobile,
  onTabChange,
  onSelectInstruction,
  setSearchQuery
}: Props) {
  return (
    <div className="space-y-8">
      {alerts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
            Aktive varsler
          </h2>
          <div className="space-y-3">
            {alerts.map(alert => {
              const isCritical = alert.severity === 'critical'
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex gap-4 p-5 rounded-lg border-2",
                    isCritical
                      ? "bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20"
                      : "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-900/10 dark:to-yellow-900/20 dark:border-yellow-900/30"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "h-5 w-5 mt-0.5 shrink-0",
                      isCritical ? "text-destructive" : "text-yellow-600 dark:text-yellow-500"
                    )}
                  />
                  <div className="flex-1">
                    <Badge variant={isCritical ? "destructive" : "outline"} className={cn(!isCritical && "border-yellow-200 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50")}>
                      {severityLabel(alert.severity)}
                    </Badge>
                    <div className="font-semibold mt-2 text-foreground">
                      {alert.title}
                    </div>
                    {alert.description && (
                      <div className="text-sm mt-2 text-muted-foreground leading-relaxed">
                        {alert.description}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-3"
      )}>
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors border-primary/20 bg-primary/5"
          onClick={() => onTabChange('instructions')}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
            <div className="h-14 w-14 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <FileText size={28} />
            </div>
            <span className="font-semibold text-primary">Instrukser</span>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-800"
          onClick={() => onTabChange('ask')}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
            <div className="h-14 w-14 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <MessageCircle size={28} />
            </div>
            <span className="font-semibold text-indigo-700 dark:text-indigo-300">Spør Tetrivo</span>
          </CardContent>
        </Card>

        {!isMobile && criticalInstructions.length > 0 && (
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors border-destructive/20 bg-destructive/5"
            onClick={() => { onTabChange('instructions'); setSearchQuery('') }}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
              <div className="h-14 w-14 rounded-md bg-destructive/10 flex items-center justify-center text-destructive">
                <Zap size={28} />
              </div>
              <span className="font-semibold text-destructive">
                {criticalInstructions.length} Kritiske
              </span>
            </CardContent>
          </Card>
        )}
      </div>

      {criticalInstructions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-destructive">
            <Zap className="h-5 w-5" />
            Kritiske instrukser
          </h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {criticalInstructions.slice(0, 3).map(inst => (
                <div
                  key={inst.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onSelectInstruction(inst)}
                >
                  <div className="h-10 w-10 rounded-md bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium mb-1 truncate">
                      {inst.title}
                    </div>
                    <Badge variant="destructive">
                      {severityLabel(inst.severity)}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-muted-foreground">
          <Clock className="h-5 w-5" />
          Siste instrukser
        </h2>
        {instructions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border rounded-lg bg-muted/5">
            <Inbox className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Ingen instrukser tilgjengelig</h3>
            <p className="max-w-sm text-sm">
              Det er ingen instrukser tildelt deg for øyeblikket. Instrukser vil vises her når de blir publisert.
            </p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y">
              {instructions.slice(0, 5).map(inst => (
                <div
                  key={inst.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onSelectInstruction(inst)}
                >
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium mb-1 truncate">
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
      </section>
    </div>
  )
}
