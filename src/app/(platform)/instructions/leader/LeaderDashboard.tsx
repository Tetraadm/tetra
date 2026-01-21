'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { FileText, Home, Users, Inbox } from 'lucide-react'
import { cleanupInviteData } from '@/lib/invite-cleanup'
import AuthWatcher from '@/components/AuthWatcher'
import type { Profile, Organization, Team } from '@/lib/types'
import { severityLabel, roleLabel } from '@/lib/ui-helpers'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar, type SidebarTab } from '@/components/layout/AppSidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Instruction = {
  id: string
  title: string
  content: string | null
  severity: string
  status: string
}

type Props = {
  profile: Profile
  organization: Organization
  team: Team | null
  teamMembers: Profile[]
  instructions: Instruction[]
}

export default function LeaderDashboard({
  profile,
  organization,
  team,
  teamMembers,
  instructions
}: Props) {
  const [tab, setTab] = useState<'oversikt' | 'team' | 'instrukser'>('oversikt')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    cleanupInviteData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleTabChange = (newTab: typeof tab) => {
    setTab(newTab)
    setShowMobileMenu(false)
  }

  const criticalInstructions = instructions.filter(i => i.severity === 'critical')

  const leaderTabs: SidebarTab[] = [
    { id: 'oversikt', label: 'Oversikt', icon: Home },
    { id: 'team', label: 'Mitt team', icon: Users },
    { id: 'instrukser', label: 'Instrukser', icon: FileText },
  ]

  return (
    <>
      <AuthWatcher />
      <div className="min-h-screen bg-background">
        <AppHeader
          onMenuClick={() => setShowMobileMenu(true)}
          user={{
            name: profile.full_name || 'Bruker',
            email: profile.email || '',
            image: ''
          }}
          organizationName={organization.name}
          onLogout={handleLogout}
        />
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
          <AppSidebar
            tabs={leaderTabs}
            activeTab={tab}
            onTabChange={(t) => handleTabChange(t as typeof tab)}
            open={showMobileMenu}
            onClose={() => setShowMobileMenu(false)}
          />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-secondary/30">
            {tab === 'oversikt' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold font-serif tracking-tight">Oversikt</h1>
                  <p className="text-muted-foreground">Velkommen tilbake, {profile.full_name}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Teammedlemmer</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{teamMembers.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Instrukser</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{instructions.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Kritiske</CardTitle>
                      <FileText className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-destructive">{criticalInstructions.length}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-destructive/20">
                  <CardHeader>
                    <CardTitle>Kritiske instrukser</CardTitle>
                    <CardDescription>Instrukser som krever spesiell oppmerksomhet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {criticalInstructions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Inbox className="h-8 w-8 mb-2 opacity-50" />
                        <p>Ingen kritiske instrukser</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {criticalInstructions.map(inst => (
                          <div key={inst.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                                <FileText size={20} />
                              </div>
                              <span className="font-medium">{inst.title}</span>
                            </div>
                            <Badge variant="destructive">{severityLabel(inst.severity)}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === 'team' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold font-serif tracking-tight">Mitt team</h1>
                  <p className="text-muted-foreground">{team?.name || 'Ingen team'}</p>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {teamMembers.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">Ingen medlemmer i teamet.</div>
                    ) : (
                      <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                          <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Navn</th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rolle</th>
                            </tr>
                          </thead>
                          <tbody className="[&_tr:last-child]:border-0">
                            {teamMembers.map(member => (
                              <tr key={member.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 font-medium">{member.full_name}</td>
                                <td className="p-4">
                                  <Badge variant="secondary">{roleLabel(member.role)}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === 'instrukser' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold font-serif tracking-tight">Instrukser</h1>
                  <p className="text-muted-foreground">Instrukser for {team?.name}</p>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {instructions.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">Ingen instrukser tildelt.</div>
                    ) : (
                      <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                          <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50">
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tittel</th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Alvorlighet</th>
                            </tr>
                          </thead>
                          <tbody className="[&_tr:last-child]:border-0">
                            {instructions.map(inst => (
                              <tr key={inst.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 font-medium">{inst.title}</td>
                                <td className="p-4">
                                  <Badge variant={inst.severity === 'critical' ? 'destructive' : 'secondary'}>
                                    {severityLabel(inst.severity)}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
