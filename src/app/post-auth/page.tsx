export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PostAuthPage() {
  const supabase = await createClient();

  // Tving session til å lastes før DB-kall
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/login?error=NO_SESSION");

  const user = session.user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle(); // i stedet for .single()

  if (profileError) {
    redirect(`/login?error=${encodeURIComponent(`PROFILE_ERR: ${profileError.message}`)}`);
  }

  if (!profile) {
    redirect(`/login?error=${encodeURIComponent(`NO_PROFILE_DB for ${user.email} (${user.id})`)}`);
  }

  if (profile.role === "admin") redirect("/admin");
  if (profile.role === "teamleader") redirect("/leader");
  redirect("/employee");
}
