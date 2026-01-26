"use client";

import {
  FolderOpen,
  Paperclip,
  Plus,
  X,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import type { Instruction, Folder } from "@/lib/types";
import { severityLabel, severityColor, statusColor } from "@/lib/ui-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResponsiveSelect } from "@/components/ui/responsive-select";

type Props = {
  instructions: Instruction[];
  folders: Folder[];
  filteredInstructions: Instruction[];
  selectedFolder: string;
  statusFilter: string;
  setSelectedFolder: (folder: string) => void;
  setStatusFilter: (status: string) => void;
  toggleInstructionStatus: (instruction: Instruction) => void;
  openEditInstruction: (instruction: Instruction) => void;
  deleteInstruction: (id: string) => void;
  deleteFolder: (id: string) => void;
  setShowCreateInstruction: (show: boolean) => void;
  setShowCreateFolder: (show: boolean) => void;
  instructionsHasMore: boolean;
  instructionsLoadingMore: boolean;
  loadMoreInstructions: () => void;
};

export default function InstructionsTab({
  folders,
  filteredInstructions,
  selectedFolder,
  statusFilter,
  setSelectedFolder,
  setStatusFilter,
  toggleInstructionStatus,
  openEditInstruction,
  deleteInstruction,
  deleteFolder,
  setShowCreateInstruction,
  setShowCreateFolder,
  instructionsHasMore,
  instructionsLoadingMore,
  loadMoreInstructions,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Instrukser
          </h1>
          <p className="text-muted-foreground mt-1">
            HMS-dokumenter og instruksjoner
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowCreateFolder(true)}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Ny mappe
          </Button>
          <Button onClick={() => setShowCreateInstruction(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ny instruks
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Filter:
          </span>

          <ResponsiveSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: "all", label: "Alle statuser" },
              { value: "published", label: "Publisert" },
              { value: "draft", label: "Utkast" },
            ]}
            className="w-40"
          />

          <div className="w-px h-6 bg-border" />

          <Button
            variant={selectedFolder === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFolder("all")}
          >
            Alle mapper
          </Button>
          <Button
            variant={selectedFolder === "none" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFolder("none")}
          >
            Uten mappe
          </Button>
          {folders.map((folder) => (
            <div key={folder.id} className="flex items-center gap-1">
              <Button
                variant={selectedFolder === folder.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <FolderOpen className="w-3 h-3 mr-1.5" />
                {folder.name}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => deleteFolder(folder.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {filteredInstructions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ingen instrukser funnet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {statusFilter !== "all" || selectedFolder !== "all"
                ? "Prøv å endre filtrene for å se flere instrukser."
                : "Kom i gang ved å opprette din første HMS-instruksjon. Instrukser kan inneholde tekst, bilder og PDF-dokumenter."}
            </p>
            {statusFilter !== "all" || selectedFolder !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all");
                  setSelectedFolder("all");
                }}
              >
                Nullstill filtre
              </Button>
            ) : (
              <Button onClick={() => setShowCreateInstruction(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Opprett instruksjon
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {filteredInstructions.map((instruction) => {
              const severityStyles = severityColor(instruction.severity);
              const statusStyles = statusColor(instruction.status);

              return (
                <div
                  key={instruction.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 hover:bg-muted/30 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {instruction.title}
                      </h3>
                      {instruction.file_path && (
                        <Paperclip className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{instruction.folders?.name || "Ingen mappe"}</span>
                      <span>•</span>
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: statusStyles.bg,
                          color: statusStyles.color,
                          borderColor: statusStyles.border,
                        }}
                      >
                        {instruction.status === "published" ? "Publisert" : "Utkast"}
                      </Badge>
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: severityStyles.bg,
                          color: severityStyles.color,
                          borderColor: severityStyles.border,
                        }}
                      >
                        {severityLabel(instruction.severity)}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => toggleInstructionStatus(instruction)}
                      >
                        {instruction.status === "published"
                          ? "Avpubliser"
                          : "Publiser"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openEditInstruction(instruction)}
                      >
                        Rediger
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteInstruction(instruction.id)}
                      >
                        Slett
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>

          {instructionsHasMore && (
            <CardContent className="pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={loadMoreInstructions}
                disabled={instructionsLoadingMore}
              >
                {instructionsLoadingMore ? "Laster..." : "Vis flere"}
              </Button>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
