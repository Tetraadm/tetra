"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Building2, FileWarning, BookOpen, ArrowRight, Lock } from "lucide-react";
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
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <div className="mb-6 flex justify-center">
                        <TetraLogo variant="full" className="scale-125" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Velg App</h1>
                    <p className="text-slate-400">Velg hvilken modul du vil jobbe med</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Instructions App Card */}
                    <button
                        onClick={() => router.push(getInstructionsPath())}
                        className="group bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 text-left hover:border-teal-500/50 hover:bg-slate-800/80 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-teal-500/20 rounded-xl">
                                <BookOpen className="h-8 w-8 text-teal-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-white">Instruksjoner</h2>
                                <p className="text-slate-400 text-sm">HMS Instruksjonssystem</p>
                            </div>
                        </div>
                        <p className="text-slate-300 mb-6">
                            Administrer og distribuer HMS-instruksjoner til ansatte. AI-drevet søk og lesebekreftelser.
                        </p>
                        <div className="flex items-center text-teal-400 group-hover:translate-x-2 transition-transform">
                            <span>Åpne</span>
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </button>

                    {/* Deviations App Card */}
                    <div
                        className={`bg-slate-800/30 backdrop-blur border rounded-2xl p-8 text-left ${modules.deviations
                            ? "border-slate-700 hover:border-orange-500/50 cursor-pointer"
                            : "border-slate-700/50 opacity-60"
                            }`}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-orange-500/20 rounded-xl">
                                <FileWarning className="h-8 w-8 text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-semibold text-white">Avvik</h2>
                                    {!modules.deviations && (
                                        <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                            <Lock className="h-3 w-3" />
                                            Tilleggstjeneste
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-400 text-sm">Avvikshåndtering</p>
                            </div>
                        </div>
                        <p className="text-slate-300 mb-6">
                            Registrer, følg opp og lukk avvik. Dashboards og statistikk for ledere.
                        </p>
                        {modules.deviations ? (
                            <div className="flex items-center text-orange-400">
                                <span>Åpne</span>
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </div>
                        ) : (
                            <div className="flex items-center text-slate-500">
                                <span>Kontakt oss for tilgang</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Org Info */}
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-500 text-sm">
                        <Building2 className="h-4 w-4" />
                        <span>Du er logget inn som {role === "admin" ? "Administrator" : role === "teamleader" ? "Teamleder" : "Ansatt"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
