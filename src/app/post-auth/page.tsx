import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PostAuthPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect(`/login?error=${encodeURIComponent(userError?.message || "Ikke innlogget")}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect(`/login?error=${encodeURIComponent(`NO_PROFILE for ${user.email} (${user.id})`)}`);
  }

  if (profile.role === "admin") redirect("/admin");
  if (profile.role === "teamleader") redirect("/leader");
  redirect("/employee");
}
