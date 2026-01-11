import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  try {
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
        console.error('AUTH_FATAL: PKCE exchange failed', error.message);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
        );
      }
    }
    // 2) token_hash-flow
    else if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      if (error) {
        console.error('AUTH_FATAL: OTP verification failed', error.message);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
        );
      }
    } else {
      console.error('AUTH_FATAL: Missing auth params');
      return NextResponse.redirect(new URL("/login?error=missing_params", origin));
    }

    // Redirect to post-auth for profile check in new request (cookies fully settled)
    response.headers.set("Location", new URL("/post-auth", origin).toString());
    return response;
  } catch (error) {
    console.error('AUTH_FATAL: Unexpected error', error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/login?error=Noe gikk galt under innlogging`);
  }
}
