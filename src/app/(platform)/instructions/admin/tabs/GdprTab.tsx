"use client";

import { Shield, Download, Eye, Lock, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GdprRequestsAdmin } from "@/components/GdprRequestsAdmin";

type Props = {
  onPendingCountChange?: (count: number) => void;
};

export default function GdprTab({ onPendingCountChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            GDPR
          </h1>
          <p className="text-muted-foreground mt-1">
            Personvern og datasikkerhet
          </p>
        </div>
        <Button variant="outline" className="min-h-[44px] bg-transparent">
          <Download className="w-4 h-4 mr-2" />
          Last ned rapport
        </Button>
      </div>

      <div className="bg-success/10 border border-success/20 rounded-xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-success" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">
            Full GDPR-samsvar
          </h3>
          <p className="text-sm text-muted-foreground">
            Din organisasjon oppfyller alle GDPR-krav. Sist verifisert 20. januar
            2026.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Hurtighandlinger</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start min-h-[48px] bg-transparent"
            >
              <Eye className="w-4 h-4 mr-3" />
              Se personvernerklæring
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start min-h-[48px] bg-transparent"
            >
              <Lock className="w-4 h-4 mr-3" />
              Administrer samtykker
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start min-h-[48px] bg-transparent"
            >
              <Download className="w-4 h-4 mr-3" />
              Eksporter alle data
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start min-h-[48px] bg-transparent"
            >
              <Clock className="w-4 h-4 mr-3" />
              Oppbevaringsfrister
            </Button>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  GDPR-samsvar aktivert
                </p>
                <p className="text-sm text-muted-foreground">
                  Brukere kan be om dataeksport og sletting av sine data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <GdprRequestsAdmin onPendingCountChange={onPendingCountChange} />
    </div>
  );
}
