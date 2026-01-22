export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PostAuthPage() {
  const supabase = await createClient();

  // getUser() gj�r en sikker server-side JWT-verifisering
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?error=NO_SESSION");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle(); // i stedet for .single()

  if (profileError) {
    console.error('PROFILE_ERR', profileError);
    redirect('/login?error=PROFILE_ERR');
  }

  if (!profile) {
    console.error('NO_PROFILE_DB', { userId: user.id });
    redirect('/login?error=NO_PROFILE_DB');
  }

  if (profile.role === "admin") redirect("/instructions/admin");
  if (profile.role === "teamleader") redirect("/instructions/leader");
  redirect("/instructions/employee");
}
