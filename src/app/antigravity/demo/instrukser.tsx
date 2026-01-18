import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, FileText, Calendar, Eye, Download } from "lucide-react"

const instructions = [
  {
    id: 1,
    title: "Brannvern og evakuering",
    category: "Sikkerhet",
    updated: "12. jan 2026",
    views: 245,
    status: "Publisert",
  },
  { id: 2, title: "Kjemikaliehåndtering", category: "Miljø", updated: "8. jan 2026", views: 189, status: "Publisert" },
  {
    id: 3,
    title: "Verneutstyr - krav og bruk",
    category: "Sikkerhet",
    updated: "5. jan 2026",
    views: 312,
    status: "Publisert",
  },
  {
    id: 4,
    title: "Førstehjelp på arbeidsplassen",
    category: "Helse",
    updated: "3. jan 2026",
    views: 178,
    status: "Under revisjon",
  },
  {
    id: 5,
    title: "Avfallshåndtering og sortering",
    category: "Miljø",
    updated: "28. des 2025",
    views: 156,
    status: "Publisert",
  },
  {
    id: 6,
    title: "Ergonomi ved kontorarbeid",
    category: "Helse",
    updated: "20. des 2025",
    views: 201,
    status: "Publisert",
  },
]

export function Instrukser() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Instrukser</h1>
          <p className="text-muted-foreground mt-1">HMS-instrukser og prosedyrer</p>
        </div>
        <Button className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Ny instruks
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Søk i instrukser..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Sikkerhet</Button>
          <Button variant="outline">Miljø</Button>
          <Button variant="outline">Helse</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {instructions.map((instruction) => (
          <Card key={instruction.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h3 className="font-semibold text-foreground">{instruction.title}</h3>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{instruction.category}</Badge>
                      <Badge
                        variant={instruction.status === "Publisert" ? "outline" : "default"}
                        className={instruction.status === "Publisert" ? "border-tetra-success text-tetra-success" : ""}
                      >
                        {instruction.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {instruction.updated}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {instruction.views} visninger
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Vis
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
