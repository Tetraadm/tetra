"use client";

import { useMemo } from "react";
import { Plus, Inbox, Search, Mail, Shield, UserCheck, MoreHorizontal } from "lucide-react";
import type { Profile, Team } from "@/lib/types";
import { roleLabel } from "@/lib/ui-helpers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  profile: Profile;
  users: Profile[];
  teams: Team[];
  openEditUser: (user: Profile) => void;
  deleteUser: (userId: string) => void;
  setShowInviteUser: (show: boolean) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  usersHasMore: boolean;
  usersLoadingMore: boolean;
  loadMoreUsers: () => void;
};

export default function UsersTab({
  profile,
  users,
  teams,
  openEditUser,
  deleteUser,
  setShowInviteUser,
  searchQuery,
  onSearchChange,
  usersHasMore,
  usersLoadingMore,
  loadMoreUsers,
}: Props) {
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return users.filter((user) => {
      const name = user.full_name?.toLowerCase() || "";
      const email = user.email?.toLowerCase() || "";
      return name.includes(query) || email.includes(query);
    });
  }, [users, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Brukere
          </h1>
          <p className="text-muted-foreground mt-1">
            Administrer brukere og tilganger
          </p>
        </div>
        <Button className="min-h-[44px]" onClick={() => setShowInviteUser(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Legg til bruker
        </Button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Søk etter brukere..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1 min-h-[32px]"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ingen brukere ennå
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Kom i gang ved å invitere din første bruker. De vil motta en
              invitasjonslenke på e-post.
            </p>
            <Button onClick={() => setShowInviteUser(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Legg til bruker
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Bruker
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    Rolle
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                    Team
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const teamName = teams.find((team) => team.id === user.team_id)?.name;
                  return (
                    <tr key={user.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {(user.full_name || "U").split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {user.full_name || "Uten navn"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email || ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            user.role === "admin"
                              ? "bg-primary/10 text-primary"
                              : user.role === "teamleader"
                                ? "bg-chart-2/10 text-chart-2"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {teamName || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditUser(user)}>
                              <Shield className="w-4 h-4 mr-2" />
                              Rediger rolle
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Send e-post
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Se detaljer
                            </DropdownMenuItem>
                            {user.id !== profile.id && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteUser(user.id)}
                              >
                                Fjern bruker
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {usersHasMore && (
            <CardContent className="pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={loadMoreUsers}
                disabled={usersLoadingMore}
              >
                {usersLoadingMore ? "Laster..." : "Vis flere"}
              </Button>
            </CardContent>
          )}
        </div>
      )}
    </div>
  );
}
