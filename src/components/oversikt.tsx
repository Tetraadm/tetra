import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, FileText, Bell, CheckCircle, TrendingUp, AlertTriangle, Shield, Activity } from "lucide-react"

const stats = [
  { label: "Aktive brukere", value: "156", icon: Users, change: "+12%", trend: "up" },
  { label: "Dokumenter", value: "2,847", icon: FileText, change: "+8%", trend: "up" },
  { label: "Ventende varsler", value: "5", icon: Bell, change: "-23%", trend: "down" },
  { label: "Lesebekreftelser", value: "94%", icon: CheckCircle, change: "+5%", trend: "up" },
]

const recentActivity = [
  { user: "Kari Hansen", action: "oppdaterte sikkerhetsinstruks", time: "2 min siden", type: "update" },
  { user: "Per Olsen", action: "bekreftet lesing av HMS-rutiner", time: "15 min siden", type: "confirm" },
  { user: "System", action: "genererte månedlig rapport", time: "1 time siden", type: "system" },
  { user: "Anne Berg", action: "opprettet nytt team", time: "2 timer siden", type: "create" },
]

export function Oversikt() {
  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Velkommen tilbake, Ola</h1>
          <p className="text-muted-foreground mt-1">Her er en oversikt over HMS-systemet ditt</p>
        </div>
        <Badge variant="outline" className="w-fit border-tetra-success text-tetra-success">
          <Shield className="h-3.5 w-3.5 mr-1" />
          Alle systemer operative
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-sm font-medium">{stat.label}</CardDescription>
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <span className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</span>
                  <span
                    className={`text-sm font-medium flex items-center ${stat.trend === "up" ? "text-tetra-success" : "text-tetra-warning"}`}
                  >
                    <TrendingUp className={`h-4 w-4 mr-1 ${stat.trend === "down" ? "rotate-180" : ""}`} />
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Samsvarsstatus
            </CardTitle>
            <CardDescription>Din organisasjons HMS-samsvar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sikkerhetsinstrukser</span>
                  <span className="font-medium text-foreground">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Miljørutiner</span>
                  <span className="font-medium text-foreground">87%</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Helseprotokoller</span>
                  <span className="font-medium text-foreground">95%</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Opplæring fullført</span>
                  <span className="font-medium text-foreground">78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-tetra-warning" />
              Viktige varsler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive">3 dokumenter utløper snart</p>
              <p className="text-xs text-muted-foreground mt-1">Fornyes innen 7 dager</p>
            </div>
            <div className="p-3 rounded-lg bg-tetra-warning/10 border border-tetra-warning/20">
              <p className="text-sm font-medium text-foreground">12 ubesvarte spørsmål</p>
              <p className="text-xs text-muted-foreground mt-1">Venter på svar</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-primary">Ny oppdatering tilgjengelig</p>
              <p className="text-xs text-muted-foreground mt-1">HMS-forskrifter 2026</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Nylig aktivitet</CardTitle>
          <CardDescription>Siste handlinger i systemet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    item.type === "system"
                      ? "bg-primary/10"
                      : item.type === "confirm"
                        ? "bg-tetra-success/10"
                        : "bg-secondary"
                  }`}
                >
                  {item.type === "system" ? (
                    <Activity className="h-5 w-5 text-primary" />
                  ) : (
                    <span className="text-sm font-semibold text-foreground">
                      {item.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{item.user}</span>{" "}
                    <span className="text-muted-foreground">{item.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
