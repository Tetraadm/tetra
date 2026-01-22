"use client";

import {
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import type { ReadReportItem, UserReadStatus } from "../hooks/useReadReport";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Props = {
  readReport: ReadReportItem[];
  readReportLoading: boolean;
  expandedInstructions: Set<string>;
  userReads: Map<string, UserReadStatus[]>;
  userReadsLoading: Set<string>;
  toggleInstructionExpansion: (id: string) => void;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
};

export default function ReadConfirmationsTab({
  readReport,
  readReportLoading,
  expandedInstructions,
  userReads,
  userReadsLoading,
  toggleInstructionExpansion,
  currentPage,
  totalPages,
  goToPage,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Lesebekreftelser
          </h1>
          <p className="text-muted-foreground mt-1">
            Spor hvem som har lest viktige dokumenter
          </p>
        </div>
        <Button className="min-h-[44px]">
          Send påminnelse
        </Button>
      </div>

      {readReportLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : readReport.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ingen lesebekreftelser ennå
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Når ansatte begynner å lese og bekrefte instrukser, vil de vises
              her.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {readReport.map((instruction) => {
              const isExpanded = expandedInstructions.has(
                instruction.instruction_id
              );
              const isLoadingUsers = userReadsLoading.has(
                instruction.instruction_id
              );
              const users = userReads.get(instruction.instruction_id) || [];
              const isComplete = instruction.confirmed_percentage === 100;

              return (
                <Card key={instruction.instruction_id} className="overflow-hidden">
                  <div
                    className={cn(
                      "cursor-pointer p-5 transition-colors hover:bg-muted/30",
                      isExpanded && "bg-muted/20 border-b"
                    )}
                    onClick={() =>
                      toggleInstructionExpansion(instruction.instruction_id)
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            isComplete ? "bg-success/10" : "bg-primary/10"
                          )}
                        >
                          {isComplete ? (
                            <CheckSquare className="w-5 h-5 text-success" />
                          ) : (
                            <FileText className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <h3 className="font-semibold text-foreground truncate">
                              {instruction.instruction_title}
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Lest: {instruction.read_count}/{instruction.total_users}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        Bekreftet {instruction.confirmed_count}/
                        {instruction.total_users}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Bekreftet</span>
                        <span>{instruction.confirmed_percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isComplete ? "bg-success" : "bg-primary"
                          )}
                          style={{ width: `${instruction.confirmed_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="p-5">
                      {isLoadingUsers ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Laster brukerdata...</span>
                        </div>
                      ) : users.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Ingen brukere funnet
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ansatt</TableHead>
                              <TableHead>E-post</TableHead>
                              <TableHead className="text-center">Lest</TableHead>
                              <TableHead className="text-center">
                                Bekreftet
                              </TableHead>
                              <TableHead>Dato</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((user) => (
                              <TableRow key={user.user_id}>
                                <TableCell className="font-medium">
                                  {user.user_name}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {user.user_email}
                                </TableCell>
                                <TableCell className="text-center">
                                  {user.has_read ? (
                                    <Check className="w-4 h-4 text-primary inline" />
                                  ) : (
                                    <X className="w-4 h-4 text-muted-foreground inline" />
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {user.confirmed ? (
                                    <Check className="w-4 h-4 text-success inline" />
                                  ) : (
                                    <X className="w-4 h-4 text-muted-foreground inline" />
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm font-mono">
                                  {user.confirmed_at
                                    ? new Date(
                                        user.confirmed_at
                                      ).toLocaleString("no-NO", {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : user.read_at
                                      ? new Date(user.read_at).toLocaleString(
                                          "no-NO",
                                          {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          }
                                        )
                                      : "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                Forrige
              </Button>
              <span className="text-sm text-muted-foreground font-mono">
                Side {currentPage + 1} av {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                Neste
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
