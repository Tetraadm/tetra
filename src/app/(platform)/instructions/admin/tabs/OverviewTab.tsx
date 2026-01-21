import { AlertTriangle, Users, FileText, File } from 'lucide-react'
import type { Profile, Alert, Instruction } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Props = {
  profile: Profile
  users: Profile[]
  instructions: Instruction[]
  alerts: Alert[]
  setTab: (tab: 'avvik') => void
}

export default function OverviewTab({ profile, users, instructions, alerts, setTab }: Props) {
  const activeAlerts = alerts.filter(a => a.active)
  const publishedInstructions = instructions.filter(i => i.status === 'published')
  const draftInstructions = instructions.filter(i => i.status === 'draft')

  const stats = [
    { label: "Totale brukere", value: users.length, icon: Users },
    { label: "Publiserte instrukser", value: publishedInstructions.length, icon: FileText },
    { label: "Utkast", value: draftInstructions.length, icon: File },
    { label: "Aktive avvik", value: activeAlerts.length, icon: AlertTriangle, status: activeAlerts.length > 0 ? 'danger' : 'success' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Velkommen, {profile.full_name}</h1>
          <p className="text-muted-foreground mt-1">Her er oversikten over din organisasjon</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-sm font-medium">{stat.label}</CardDescription>
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${stat.status === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <span className={`text-2xl lg:text-3xl font-bold ${stat.status === 'danger' ? 'text-destructive' : 'text-foreground'}`}>
                    {stat.value}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {activeAlerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Krever oppmerksomhet
            </CardTitle>
            <CardDescription>
              {activeAlerts.length} aktive avvik som må håndteres.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-destructive/20">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`${alert.severity === 'critical' ? 'border-destructive text-destructive' : 'border-amber-500 text-foreground'}`}>
                      {alert.severity}
                    </Badge>
                    <span className="font-medium">{alert.title}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={() => setTab('avvik')} className="w-full mt-2 border-destructive/30 hover:bg-destructive/10 text-destructive">
                Se alle avvik
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

