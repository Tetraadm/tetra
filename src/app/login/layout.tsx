import Link from 'next/link'
import { ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950">
            {/* Left side - branding */}
            <div
                className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-between p-12 text-white bg-indigo-900"
                style={{
                    // Using inline style for gradient as fallback/override if tailwind config varies
                    background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
                }}
            >
                <div>
                    <Link href="/" className="flex items-center gap-3 focus-ring rounded-lg">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                            <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Tetra</span>
                    </Link>
                </div>

                <div className="space-y-8 max-w-lg">
                    <h1 className="text-4xl font-bold leading-tight tracking-tight">
                        Komplett HMS-plattform for moderne bedrifter
                    </h1>
                    <p className="text-lg text-indigo-100 leading-relaxed">
                        Effektiviser sikkerhetsarbeidet med digitale instrukser, automatiserte varsler og full oversikt over etterlevelse.
                    </p>

                    {/* Features list */}
                    <ul className="space-y-4 pt-4" aria-label="Funksjoner">
                        {[
                            'Sentralisert instruksjonsbibliotek',
                            'Sanntidsvarsling og oppgavehåndtering',
                            'AI-assistert HMS-rådgivning',
                            'Automatisk dokumentasjon og rapportering',
                        ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-indigo-300 flex-shrink-0" aria-hidden="true" />
                                <span className="text-indigo-50 font-medium">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="text-sm text-indigo-200/60">
                    © {new Date().getFullYear()} Tetra AS. Alle rettigheter forbeholdt.
                </div>
            </div>

            {/* Right side - auth form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800">
                    {children}
                </div>
            </div>
        </div>
    )
}
