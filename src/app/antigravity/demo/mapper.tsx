import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Folder, FolderOpen, File, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const folders = [
  { id: 1, name: "Sikkerhetsinstrukser", files: 24, updated: "I dag", icon: FolderOpen, color: "text-primary" },
  { id: 2, name: "Miljørutiner", files: 18, updated: "I går", icon: Folder, color: "text-tetra-success" },
  { id: 3, name: "Helseprotokoller", files: 12, updated: "3 dager siden", icon: Folder, color: "text-chart-2" },
  { id: 4, name: "Opplæringsmateriell", files: 45, updated: "1 uke siden", icon: Folder, color: "text-tetra-warning" },
  { id: 5, name: "Skjemaer", files: 32, updated: "2 uker siden", icon: Folder, color: "text-chart-5" },
  { id: 6, name: "Rapporter 2025", files: 56, updated: "1 måned siden", icon: Folder, color: "text-muted-foreground" },
]

const recentFiles = [
  { id: 1, name: "Brannvernplan_2026.pdf", folder: "Sikkerhetsinstrukser", size: "2.4 MB" },
  { id: 2, name: "Risikovurdering_lager.docx", folder: "Sikkerhetsinstrukser", size: "456 KB" },
  { id: 3, name: "Miljørapport_Q4.xlsx", folder: "Miljørutiner", size: "1.2 MB" },
]

export function Mapper() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Mapper</h1>
          <p className="text-muted-foreground mt-1">Organiser dokumenter og filer</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="w-fit bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Ny mappe
          </Button>
          <Button className="w-fit">
            <Plus className="h-4 w-4 mr-2" />
            Last opp
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Søk i mapper og filer..." className="pl-10" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {folders.map((folder) => {
          const Icon = folder.icon
          return (
            <Card
              key={folder.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group"
            >
              <CardContent className="p-4 text-center">
                <div className="relative">
                  <Icon className={`h-12 w-12 mx-auto ${folder.color}`} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Åpne</DropdownMenuItem>
                      <DropdownMenuItem>Gi nytt navn</DropdownMenuItem>
                      <DropdownMenuItem>Del</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Slett</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-medium text-sm mt-3 text-foreground truncate">{folder.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{folder.files} filer</p>
                <p className="text-xs text-muted-foreground">{folder.updated}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4">Nylig brukte filer</h3>
          <div className="space-y-3">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <File className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.folder} • {file.size}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Åpne
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
