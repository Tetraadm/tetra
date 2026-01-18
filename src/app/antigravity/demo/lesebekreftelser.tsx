import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckSquare, Clock, AlertCircle, FileText, Send } from "lucide-react"

const documents = [
  {
    id: 1,
    title: "Brannvern og evakuering 2026",
    confirmed: 142,
    total: 156,
    deadline: "20. jan 2026",
    status: "active",
  },
  {
    id: 2,
    title: "Kjemikaliehåndtering - oppdatert",
    confirmed: 45,
    total: 48,
    deadline: "15. jan 2026",
    status: "active",
  },
  { id: 3, title: "Verneutstyr - nye krav", confirmed: 156, total: 156, deadline: "10. jan 2026", status: "complete" },
  { id: 4, title: "HMS-håndbok 2026", confirmed: 89, total: 156, deadline: "25. jan 2026", status: "active" },
]

const pendingUsers = [
  { name: "Erik Johansen", document: "Brannvern og evakuering", daysOverdue: 3 },
  { name: "Liv Andersen", document: "Brannvern og evakuering", daysOverdue: 2 },
  { name: "Thomas Berg", document: "HMS-håndbok 2026", daysOverdue: 0 },
]

export function Lesebekreftelser() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Lesebekreftelser</h1>
          <p className="text-muted-foreground mt-1">Spor hvem som har lest viktige dokumenter</p>
        </div>
        <Button className="w-fit">
          <Send className="h-4 w-4 mr-2" />
          Send påminnelse
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-tetra-success/10 flex items-center justify-center">
              <CheckSquare className="h-6 w-6 text-tetra-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">94%</p>
              <p className="text-sm text-muted-foreground">Gjennomsnittlig bekreftelse</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-tetra-warning/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-tetra-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">14</p>
              <p className="text-sm text-muted-foreground">Ventende bekreftelser</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-sm text-muted-foreground">Forfalt frister</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive dokumenter</CardTitle>
          <CardDescription>Dokumenter som venter på lesebekreftelse</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documents.map((doc) => {
            const percentage = Math.round((doc.confirmed / doc.total) * 100)
            return (
              <div
                key={doc.id}
                className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{doc.title}</h4>
                      <p className="text-sm text-muted-foreground">Frist: {doc.deadline}</p>
                    </div>
                  </div>
                  <Badge
                    variant={doc.status === "complete" ? "default" : "outline"}
                    className={
                      doc.status === "complete" ? "bg-tetra-success" : "border-tetra-warning text-tetra-warning"
                    }
                  >
                    {doc.status === "complete" ? "Fullført" : "Pågår"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {doc.confirmed} av {doc.total} bekreftet
                    </span>
                    <span className="font-medium text-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Pending users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-tetra-warning" />
            Mangler bekreftelse
          </CardTitle>
          <CardDescription>Brukere som ikke har bekreftet lesing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`/.jpg?height=36&width=36&query=${user.name} portrait`} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.document}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.daysOverdue > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {user.daysOverdue} dager forsinket
                    </Badge>
                  )}
                  <Button size="sm" variant="outline">
                    Påminn
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
