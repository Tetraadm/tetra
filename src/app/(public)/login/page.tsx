"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Users,
  FileText,
  Sparkles,
  Moon,
  Sun,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === "Invalid login credentials") {
        setError("Feil e-post eller passord");
      } else {
        // Show generic Norwegian message instead of raw error
        setError("Kunne ikke logge inn. Prøv igjen eller kontakt support.");
        console.error("Login error:", error.message);
      }
      setIsLoading(false);
    } else {
      router.push("/post-auth");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const features = [
    {
      icon: Shield,
      title: "Sikker HMS-håndtering",
      description: "Alt på ett sted, alltid oppdatert",
    },
    {
      icon: Users,
      title: "Team-samarbeid",
      description: "Enkel deling med hele organisasjonen",
    },
    {
      icon: FileText,
      title: "Smarte instrukser",
      description: "AI-genererte og tilpassede dokumenter",
    },
    {
      icon: Sparkles,
      title: "AI-assistent",
      description: "Få svar på HMS-spørsmål umiddelbart",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary/15 rounded-full blur-3xl" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div>
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                <Image
                  src="/tetrivo-logo.png"
                  alt="Tetrivo"
                  width={48}
                  height={48}
                  className="relative rounded-xl"
                />
              </div>
              <span className="text-2xl font-bold text-foreground">Tetrivo</span>
            </Link>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight text-balance">
                HMS-plattformen som forenkler arbeidshverdagen
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Logg inn for å få tilgang til instrukser, kunngjøringer og
                AI-assistenten som hjelper deg med HMS-spørsmål.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div>
              <div className="text-3xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted-foreground">
                Norske bedrifter
              </div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <div className="text-3xl font-bold text-foreground">50 000+</div>
              <div className="text-sm text-muted-foreground">Aktive brukere</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <div className="text-3xl font-bold text-foreground">99.9%</div>
              <div className="text-sm text-muted-foreground">Oppetid</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col">
        <div className="flex items-center justify-between p-6 lg:p-8">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <Image
              src="/tetrivo-logo.png"
              alt="Tetrivo"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-foreground">Tetrivo</span>
          </Link>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Velkommen tilbake
              </h2>
              <p className="text-muted-foreground">
                Logg inn på din Tetrivo-konto
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-postadresse
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="navn@bedrift.no"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Passord
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Skriv inn passord"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Husk meg på denne enheten
                </Label>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Logger inn...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Logg inn</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>


          </div>
        </div>

        <div className="p-6 lg:p-8 text-center">
          <p className="text-xs text-muted-foreground">
            Kontakt din administrator for å få tilgang til Tetrivo.
          </p>
        </div>
      </div>
    </div>
  );
}
