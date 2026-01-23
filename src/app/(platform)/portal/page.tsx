"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Building2, Megaphone, BookOpen, ArrowRight, Lock } from "lucide-react";
import { TetraLogo } from "@/components/tetra-logo";

interface OrgModules {
    instructions: boolean;
    deviations: boolean;
}

export default function PortalPage() {
    const [modules, setModules] = useState<OrgModules>({ instructions: true, deviations: false });
    const [role, setRole] = useState<string>("employee");
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role, org_id, organizations(enabled_modules)")
                .eq("id", user.id)
                .single();

            if (profile) {
                setRole(profile.role || "employee");
                // Future: Read enabled_modules from org
                // For now, instructions is always enabled, deviations is feature-flagged
                setModules({
                    instructions: true,
                    deviations: false, // Will be: profile.organizations?.enabled_modules?.includes('deviations')
                });
            }
            setLoading(false);
        }
        loadProfile();
    }, [supabase, router]);

    const getInstructionsPath = () => {
        if (role === "admin") return "/instructions/admin";
        if (role === "teamleader") return "/instructions/leader";
        return "/instructions/employee";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.12),transparent_55%)]" />
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <div className="mb-6 flex justify-center">
                        <TetraLogo size={44} />
                    </div>
                    <h1 className="font-serif text-4xl font-semibold text-foreground mb-4">Velg app</h1>
                    <p className="text-muted-foreground">Velg hvilken modul du vil jobbe med</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Instructions App Card */}
                    <button
                        onClick={() => router.push(getInstructionsPath())}
                        className="group rounded-3xl border border-border/80 bg-card/80 p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                <BookOpen className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-foreground">Instruksjoner</h2>
                                <p className="text-muted-foreground text-sm">HMS-instruksjonssystem</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground mb-6">
                            Administrer og distribuer HMS-instruksjoner til ansatte. AI-basert søk og lesebekreftelser.
                        </p>
                        <div className="flex items-center text-primary group-hover:translate-x-2 transition-transform">
                            <span>Åpne</span>
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </button>

                    {/* Announcements App Card */}
                    <div
                        className={`rounded-3xl border p-8 text-left shadow-sm transition-all ${modules.deviations
                            ? "border-border/80 bg-card/80 hover:-translate-y-1 hover:shadow-lg"
                            : "border-border/60 bg-secondary/50 opacity-70"
                            }`}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-accent/10 rounded-xl text-accent">
                                <Megaphone className="h-8 w-8" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-semibold text-foreground">Kunngjøringer</h2>
                                    {!modules.deviations && (
                                        <span className="bg-secondary text-muted-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                            <Lock className="h-3 w-3" />
                                            Tilleggstjeneste
                                        </span>
                                    )}
                                </div>
                                <p className="text-muted-foreground text-sm">Meldinger til ansatte</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground mb-6">
                            Send viktige meldinger til alle ansatte eller utvalgte team. Prioritet og synlighet styres fra administrator.
                        </p>
                        {modules.deviations ? (
                            <div className="flex items-center text-accent">
                                <span>Åpne</span>
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </div>
                        ) : (
                            <div className="flex items-center text-muted-foreground">
                                <span>Kontakt oss for tilgang</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Org Info */}
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                        <Building2 className="h-4 w-4" />
                        <span>Du er logget inn som {role === "admin" ? "Administrator" : role === "teamleader" ? "Teamleder" : "Ansatt"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
