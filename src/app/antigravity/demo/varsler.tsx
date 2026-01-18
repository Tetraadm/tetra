import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle, Info, CheckCircle, X, Settings } from "lucide-react"

const alerts = [
  {
    id: 1,
    title: "Dokument utløper snart",
    message: "Brannvernplan utløper om 5 dager og må fornyes.",
    type: "warning",
    time: "2 timer siden",
    read: false,
  },
  {
    id: 2,
    title: "Ny HMS-forskrift publisert",
    message: "Arbeidstilsynet har publisert oppdaterte forskrifter for 2026.",
    type: "info",
    time: "1 dag siden",
    read: false,
  },
  {
    id: 3,
    title: "Obligatorisk opplæring",
    message: "15 ansatte mangler påkrevd sikkerhetsopplæring.",
    type: "error",
    time: "2 dager siden",
    read: false,
  },
  {
    id: 4,
    title: "Rapport godkjent",
    message: "Kvartalsrapport Q4 2025 er godkjent av ledelsen.",
    type: "success",
    time: "3 dager siden",
    read: true,
  },
  {
    id: 5,
    title: "Systemvedlikehold",
    message: "Planlagt vedlikehold 20. januar kl. 02:00-04:00.",
    type: "info",
    time: "1 uke siden",
    read: true,
  },
]

const getAlertIcon = (type: string) => {
  switch (type) {
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-tetra-warning" />
    case "error":
      return <AlertTriangle className="h-5 w-5 text-destructive" />
    case "success":
      return <CheckCircle className="h-5 w-5 text-tetra-success" />
    default:
      return <Info className="h-5 w-5 text-primary" />
  }
}

const getAlertBg = (type: string, read: boolean) => {
  if (read) return "bg-card"
  switch (type) {
    case "warning":
      return "bg-tetra-warning/5 border-tetra-warning/20"
    case "error":
      return "bg-destructive/5 border-destructive/20"
    case "success":
      return "bg-tetra-success/5 border-tetra-success/20"
    default:
      return "bg-primary/5 border-primary/20"
  }
}

export function Varsler() {
  const unreadCount = alerts.filter((a) => !a.read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Varsler</h1>
          <p className="text-muted-foreground mt-1">Hold deg oppdatert på viktige hendelser</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="w-fit bg-transparent">
            Marker alle som lest
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary" className="gap-1">
          <Bell className="h-3 w-3" />
          Alle ({alerts.length})
        </Badge>
        <Badge variant="outline" className="gap-1 border-destructive/50 text-destructive">
          <AlertTriangle className="h-3 w-3" />
          Uleste ({unreadCount})
        </Badge>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card key={alert.id} className={`transition-all hover:shadow-sm ${getAlertBg(alert.type, alert.read)}`}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`font-semibold text-foreground ${!alert.read ? "" : "text-muted-foreground"}`}>
                        {alert.title}
                        {!alert.read && <span className="ml-2 h-2 w-2 rounded-full bg-primary inline-block" />}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{alert.time}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
