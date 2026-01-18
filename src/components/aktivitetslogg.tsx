import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, Download, FileText, Users, Settings, Shield, Folder, Eye } from "lucide-react"

const activities = [
  {
    id: 1,
    user: "Kari Hansen",
    action: "oppdaterte",
    target: "Brannvernplan 2026",
    type: "document",
    time: "10:45",
    date: "I dag",
  },
  {
    id: 2,
    user: "Per Olsen",
    action: "bekreftet lesing av",
    target: "HMS-rutiner",
    type: "confirmation",
    time: "10:32",
    date: "I dag",
  },
  {
    id: 3,
    user: "System",
    action: "sendte påminnelse til",
    target: "14 brukere",
    type: "system",
    time: "10:00",
    date: "I dag",
  },
  { id: 4, user: "Anne Berg", action: "opprettet", target: "Team Lager", type: "team", time: "09:15", date: "I dag" },
  {
    id: 5,
    user: "Magnus Kristiansen",
    action: "endret tilgangsrettigheter for",
    target: "Produksjon-mappen",
    type: "security",
    time: "08:45",
    date: "I dag",
  },
  {
    id: 6,
    user: "Liv Andersen",
    action: "lastet opp",
    target: "Risikovurdering Q1.pdf",
    type: "document",
    time: "16:30",
    date: "I går",
  },
  {
    id: 7,
    user: "Erik Johansen",
    action: "logget inn fra",
    target: "ny enhet",
    type: "security",
    time: "14:20",
    date: "I går",
  },
  {
    id: 8,
    user: "Kari Hansen",
    action: "arkiverte",
    target: "Gamle HMS-rutiner 2024",
    type: "document",
    time: "11:00",
    date: "I går",
  },
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case "document":
      return <FileText className="h-4 w-4" />
    case "confirmation":
      return <Eye className="h-4 w-4" />
    case "team":
      return <Users className="h-4 w-4" />
    case "system":
      return <Settings className="h-4 w-4" />
    case "security":
      return <Shield className="h-4 w-4" />
    default:
      return <Folder className="h-4 w-4" />
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case "document":
      return "bg-primary/10 text-primary"
    case "confirmation":
      return "bg-tetra-success/10 text-tetra-success"
    case "team":
      return "bg-chart-2/10 text-chart-2"
    case "system":
      return "bg-muted text-muted-foreground"
    case "security":
      return "bg-tetra-warning/10 text-tetra-warning"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export function Aktivitetslogg() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Aktivitetslogg</h1>
          <p className="text-muted-foreground mt-1">Spor alle handlinger i systemet</p>
        </div>
        <Button variant="outline" className="w-fit bg-transparent">
          <Download className="h-4 w-4 mr-2" />
          Eksporter logg
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Søk i aktivitetsloggen..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nylig aktivitet</CardTitle>
          <CardDescription>Alle handlinger de siste 7 dagene</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {activities.map((activity, index) => {
              const showDateHeader = index === 0 || activities[index - 1].date !== activity.date
              return (
                <div key={activity.id}>
                  {showDateHeader && (
                    <div className="py-3">
                      <Badge variant="secondary" className="font-normal">
                        {activity.date}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${getActivityColor(activity.type)}`}
                    >
                      {activity.user === "System" ? (
                        getActivityIcon(activity.type)
                      ) : (
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={`/.jpg?height=36&width=36&query=${activity.user} portrait`}
                          />
                          <AvatarFallback className="bg-transparent text-xs">
                            {activity.user
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>{" "}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
