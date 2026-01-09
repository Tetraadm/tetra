import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;

  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type"); // magiclink/email

  // Lag response først, så vi kan feste cookies på akkurat den responsen vi returnerer
  const response = NextResponse.redirect(new URL("/login", origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 1) PKCE-flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
      );
    }
  }
  // 2) token_hash-flow
  else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
      );
    }
  } else {
    return NextResponse.redirect(new URL("/login?error=missing_params", origin));
  }

  // Nå skal session være i cookies på response
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(userError?.message || "no_user")}`, origin)
    );
  }

  // Invite-first: må ha profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Du må bli invitert for å bruke Tetra")}`, origin)
    );
  }

  const dest =
    profile.role === "admin" ? "/admin" :
    profile.role === "teamleader" ? "/leader" :
    "/employee";

  response.headers.set("Location", new URL(dest, origin).toString());
  return response;
}
