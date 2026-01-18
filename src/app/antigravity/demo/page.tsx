"use client"

import { useState } from "react"
import { Header } from "@/app/antigravity/demo/header"
import { Sidebar } from "@/app/antigravity/demo/sidebar"
import { Oversikt } from "@/app/antigravity/demo/oversikt"
import { Brukere } from "@/app/antigravity/demo/brukere"
import { Team } from "@/app/antigravity/demo/team"
import { Instrukser } from "@/app/antigravity/demo/instrukser"
import { Mapper } from "@/app/antigravity/demo/mapper"
import { Varsler } from "@/app/antigravity/demo/varsler"
import { Lesebekreftelser } from "@/app/antigravity/demo/lesebekreftelser"
import { Aktivitetslogg } from "@/app/antigravity/demo/aktivitetslogg"
import { AILogg } from "@/app/antigravity/demo/ai-logg"
import { Ubesvarte } from "@/app/antigravity/demo/ubesvarte"

export default function TetraDashboard() {
  const [activeTab, setActiveTab] = useState("oversikt")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case "oversikt":
        return <Oversikt />
      case "brukere":
        return <Brukere />
      case "team":
        return <Team />
      case "instrukser":
        return <Instrukser />
      case "mapper":
        return <Mapper />
      case "varsler":
        return <Varsler />
      case "lesebekreftelser":
        return <Lesebekreftelser />
      case "aktivitetslogg":
        return <Aktivitetslogg />
      case "ai-logg":
        return <AILogg />
      case "ubesvarte":
        return <Ubesvarte />
      default:
        return <Oversikt />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  )
}
