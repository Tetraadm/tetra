import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, MoreHorizontal, Mail, Shield } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const users = [
  {
    id: 1,
    name: "Kari Hansen",
    email: "kari@bedrift.no",
    role: "Administrator",
    status: "Aktiv",
    team: "HMS-avdeling",
  },
  { id: 2, name: "Per Olsen", email: "per@bedrift.no", role: "Bruker", status: "Aktiv", team: "Produksjon" },
  { id: 3, name: "Anne Berg", email: "anne@bedrift.no", role: "Teamleder", status: "Aktiv", team: "Lager" },
  { id: 4, name: "Erik Johansen", email: "erik@bedrift.no", role: "Bruker", status: "Inaktiv", team: "Kontor" },
  { id: 5, name: "Liv Andersen", email: "liv@bedrift.no", role: "Bruker", status: "Aktiv", team: "Produksjon" },
  { id: 6, name: "Magnus Kristiansen", email: "magnus@bedrift.no", role: "Administrator", status: "Aktiv", team: "IT" },
]

export function Brukere() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Brukere</h1>
          <p className="text-muted-foreground mt-1">Administrer brukere i organisasjonen</p>
        </div>
        <Button className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Legg til bruker
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Alle brukere</CardTitle>
              <CardDescription>{users.length} brukere totalt</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Søk etter brukere..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Bruker</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Team
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                    Rolle
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Handling</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`/.jpg?height=40&width=40&query=${user.name} portrait`}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <span className="text-sm text-foreground">{user.team}</span>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <Badge variant={user.role === "Administrator" ? "default" : "secondary"}>
                        {user.role === "Administrator" && <Shield className="h-3 w-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={user.status === "Aktiv" ? "outline" : "secondary"}
                        className={user.status === "Aktiv" ? "border-tetra-success text-tetra-success" : ""}
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send e-post
                          </DropdownMenuItem>
                          <DropdownMenuItem>Rediger bruker</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Deaktiver</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
