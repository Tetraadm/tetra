import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Sparkles, FileText, Search, MessageSquare, CheckCircle, Clock } from "lucide-react"

const aiActivities = [
  {
    id: 1,
    type: "document",
    action: "Genererte sammendrag av HMS-håndbok",
    status: "complete",
    time: "11:30",
    tokens: 1250,
  },
  {
    id: 2,
    type: "search",
    action: "Søkte etter relevante forskrifter",
    status: "complete",
    time: "11:15",
    tokens: 450,
  },
  { id: 3, type: "chat", action: "Svarte på spørsmål om verneutstyr", status: "complete", time: "10:45", tokens: 890 },
  { id: 4, type: "document", action: "Analyserte risikovurdering", status: "processing", time: "10:30", tokens: 2100 },
  {
    id: 5,
    type: "chat",
    action: "Hjalp med å skrive sikkerhetsinstruks",
    status: "complete",
    time: "09:20",
    tokens: 1680,
  },
  { id: 6, type: "search", action: "Fant relevante opplæringsvideoer", status: "complete", time: "08:45", tokens: 320 },
]

const getTypeIcon = (type: string) => {
  switch (type) {
    case "document":
      return <FileText className="h-4 w-4" />
    case "search":
      return <Search className="h-4 w-4" />
    case "chat":
      return <MessageSquare className="h-4 w-4" />
    default:
      return <Bot className="h-4 w-4" />
  }
}

export function AILogg() {
  const totalTokens = aiActivities.reduce((sum, a) => sum + a.tokens, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">AI-logg</h1>
          <p className="text-muted-foreground mt-1">Oversikt over AI-assistentens aktiviteter</p>
        </div>
        <Badge variant="outline" className="w-fit border-primary text-primary gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          AI-assistent aktiv
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{aiActivities.length}</p>
              <p className="text-sm text-muted-foreground">Oppgaver i dag</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-tetra-success/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-tetra-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {aiActivities.filter((a) => a.status === "complete").length}
              </p>
              <p className="text-sm text-muted-foreground">Fullført</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalTokens.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Tokens brukt</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-funksjoner
          </CardTitle>
          <CardDescription>Hva AI-assistenten kan hjelpe deg med</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
              <h4 className="font-medium text-foreground">Dokumentanalyse</h4>
              <p className="text-sm text-muted-foreground mt-1">Oppsummer og analyser HMS-dokumenter</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <Search className="h-8 w-8 mx-auto text-primary mb-2" />
              <h4 className="font-medium text-foreground">Smart søk</h4>
              <p className="text-sm text-muted-foreground mt-1">Finn relevant informasjon raskt</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-primary mb-2" />
              <h4 className="font-medium text-foreground">HMS-rådgiver</h4>
              <p className="text-sm text-muted-foreground mt-1">Få svar på HMS-spørsmål</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity log */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitetshistorikk</CardTitle>
          <CardDescription>Alle AI-operasjoner i dag</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {getTypeIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{activity.tokens} tokens</span>
                  </div>
                </div>
                <Badge
                  variant={activity.status === "complete" ? "outline" : "secondary"}
                  className={activity.status === "complete" ? "border-tetra-success text-tetra-success" : ""}
                >
                  {activity.status === "complete" ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" /> Fullført
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" /> Pågår
                    </>
                  )}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
