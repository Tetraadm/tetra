import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HelpCircle, MessageSquare, Clock, AlertTriangle, Send, Bot } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const questions = [
  {
    id: 1,
    user: "Erik Johansen",
    question: "Hvor finner jeg skjema for å rapportere nestenulykker?",
    category: "Skjemaer",
    time: "2 timer siden",
    priority: "high",
  },
  {
    id: 2,
    user: "Liv Andersen",
    question: "Hva er kravene til verneutstyr i kjemikalierommet?",
    category: "Sikkerhet",
    time: "4 timer siden",
    priority: "high",
  },
  {
    id: 3,
    user: "Thomas Berg",
    question: "Hvordan registrerer jeg fullført sikkerhetsopplæring?",
    category: "Opplæring",
    time: "1 dag siden",
    priority: "medium",
  },
  {
    id: 4,
    user: "Maria Nilsen",
    question: "Kan jeg få tilgang til miljørapportene fra 2024?",
    category: "Dokumenter",
    time: "1 dag siden",
    priority: "low",
  },
  {
    id: 5,
    user: "Anders Vik",
    question: "Hvem er verneombud på avdeling 3?",
    category: "Organisasjon",
    time: "2 dager siden",
    priority: "medium",
  },
]

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive">Høy prioritet</Badge>
    case "medium":
      return (
        <Badge variant="outline" className="border-tetra-warning text-tetra-warning">
          Medium
        </Badge>
      )
    default:
      return <Badge variant="secondary">Lav</Badge>
  }
}

export function Ubesvarte() {
  const highPriority = questions.filter((q) => q.priority === "high").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Ubesvarte spørsmål</h1>
          <p className="text-muted-foreground mt-1">Spørsmål fra ansatte som venter på svar</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {highPriority} høy prioritet
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-tetra-warning/10 flex items-center justify-center">
              <HelpCircle className="h-6 w-6 text-tetra-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{questions.length}</p>
              <p className="text-sm text-muted-foreground">Totalt ubesvart</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">4.2t</p>
              <p className="text-sm text-muted-foreground">Gjennomsnittlig ventetid</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-tetra-success/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-tetra-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">89%</p>
              <p className="text-sm text-muted-foreground">Svarrate denne måneden</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((question) => (
          <Card key={question.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={`/.jpg?height=40&width=40&query=${question.user} portrait`}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {question.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{question.user}</span>
                        <Badge variant="secondary">{question.category}</Badge>
                        {getPriorityBadge(question.priority)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {question.time}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-foreground">{question.question}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Textarea placeholder="Skriv ditt svar her..." className="flex-1 min-h-[80px]" />
                  <div className="flex sm:flex-col gap-2">
                    <Button className="flex-1 sm:flex-none">
                      <Send className="h-4 w-4 mr-2" />
                      Svar
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none bg-transparent">
                      <Bot className="h-4 w-4 mr-2" />
                      AI-forslag
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
