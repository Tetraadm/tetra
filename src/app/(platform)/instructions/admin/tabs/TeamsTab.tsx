"use client";

import { Plus, Users, MoreHorizontal, Inbox } from "lucide-react";
import type { Profile, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  teams: Team[];
  users: Profile[];
  deleteTeam: (teamId: string) => void;
  setShowCreateTeam: (show: boolean) => void;
  teamMemberCounts: Record<string, number>;
  teamsHasMore: boolean;
  teamsLoadingMore: boolean;
  loadMoreTeams: () => void;
};

const teamColors = [
  "bg-primary",
  "bg-chart-2",
  "bg-chart-4",
  "bg-chart-3",
  "bg-chart-5",
];

export default function TeamsTab({
  teams,
  users,
  deleteTeam,
  setShowCreateTeam,
  teamMemberCounts,
  teamsHasMore,
  teamsLoadingMore,
  loadMoreTeams,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Team
          </h1>
          <p className="text-muted-foreground mt-1">
            Organiser brukere i team og avdelinger
          </p>
        </div>
        <Button className="min-h-[44px]" onClick={() => setShowCreateTeam(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Opprett team
        </Button>
      </div>

      {teams.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ingen team ennå
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Kom i gang ved å opprette ditt første team. Team hjelper deg å
              organisere brukere og instrukser.
            </p>
            <Button onClick={() => setShowCreateTeam(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Opprett team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team, index) => {
            const color = teamColors[index % teamColors.length];
            const memberCount =
              teamMemberCounts[team.id] ??
              users.filter((user) => user.team_id === team.id).length;

            return (
              <div
                key={team.id}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-lg ${color}/10 flex items-center justify-center`}
                  >
                    <Users className={`w-5 h-5 ${color.replace("bg-", "text-")}`} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Rediger</DropdownMenuItem>
                      <DropdownMenuItem>Administrer medlemmer</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteTeam(team.id)}
                      >
                        Slett team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-semibold text-foreground mb-1 truncate">
                  {team.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Team i organisasjonen
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(4, memberCount) }).map(
                      (_, i) => (
                        <Avatar key={i} className="w-7 h-7 border-2 border-card">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {String.fromCharCode(65 + i)}
                          </AvatarFallback>
                        </Avatar>
                      )
                    )}
                    {memberCount > 4 && (
                      <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          +{memberCount - 4}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {memberCount} medlemmer
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {teamsHasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadMoreTeams}
            disabled={teamsLoadingMore}
          >
            {teamsLoadingMore ? "Laster..." : "Vis flere"}
          </Button>
        </div>
      )}
    </div>
  );
}
