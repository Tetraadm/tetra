import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Users, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const teams = [
  {
    id: 1,
    name: "HMS-avdeling",
    members: 8,
    lead: "Kari Hansen",
    description: "Hovedansvar for helse, miljø og sikkerhet",
    color: "bg-primary",
  },
  {
    id: 2,
    name: "Produksjon",
    members: 24,
    lead: "Erik Johansen",
    description: "Produksjonslinje og kvalitetskontroll",
    color: "bg-tetra-success",
  },
  {
    id: 3,
    name: "Lager",
    members: 12,
    lead: "Anne Berg",
    description: "Lager og logistikk",
    color: "bg-tetra-warning",
  },
  {
    id: 4,
    name: "Kontor",
    members: 15,
    lead: "Per Olsen",
    description: "Administrasjon og kundeservice",
    color: "bg-chart-2",
  },
  {
    id: 5,
    name: "IT",
    members: 6,
    lead: "Magnus Kristiansen",
    description: "Teknisk støtte og systemadministrasjon",
    color: "bg-chart-5",
  },
]

export function Team() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground mt-1">Organiser og administrer team</p>
        </div>
        <Button className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Opprett team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Card key={team.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
            <div className={`absolute top-0 left-0 right-0 h-1 ${team.color}`} />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <CardDescription className="mt-1">{team.description}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger team</DropdownMenuItem>
                    <DropdownMenuItem>Administrer medlemmer</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Slett team</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/.jpg?height=32&width=32&query=${team.lead} portrait`} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {team.lead
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{team.lead}</p>
                    <p className="text-xs text-muted-foreground">Teamleder</p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {team.members}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
