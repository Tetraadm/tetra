export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PostAuthPage() {
  const supabase = await createClient();

  // getUser() gjør en sikker server-side JWT-verifisering
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?error=NO_SESSION");

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
