import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { origin, searchParams } = url;

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  console.log("[auth/callback] entered", {
    hasCode: Boolean(code),
    next,
    oauthError: oauthError ?? null,
  });

  // 배포 환경에서 env 값을 제대로 쓰는지(값 자체는 숨기고) 확인용 로그
  console.log("[auth/callback] env check", {
    NEXT_PUBLIC_SUPABASE_URL_set: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY_len: process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
    NEXT_PUBLIC_APP_URL_set: Boolean(process.env.NEXT_PUBLIC_APP_URL),
  });

  if (oauthError) {
    const msg = `OAuth 오류: ${oauthError}${
      oauthErrorDescription ? ` (${oauthErrorDescription})` : ""
    }`;
    console.error("[auth/callback] oauthError", { msg });
    return redirectToError(origin, msg);
  }

  if (!code) {
    const msg =
      "OAuth callback에서 `code` 파라미터를 찾지 못했습니다. (code=null)";
    console.error("[auth/callback] missing code", { msg });
    return redirectToError(origin, msg);
  }

  console.log("[auth/callback] code exists - start exchangeCodeForSession");

  const successResponse = NextResponse.redirect(`${origin}${next}`);
  try {
    const supabase = await createClient(successResponse);

    // 세션 교환 시작
    console.log("[auth/callback] session exchange started");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchange failed", {
        message: error.message,
        stack: (error as any).stack,
      });
      return redirectToError(origin, error.message, (error as any).stack);
    }

    console.log("[auth/callback] exchange success", {
      userId: data?.session?.user?.id ?? null,
    });
    return successResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : "세션 교환 실패";
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[auth/callback] exchange threw", { message, stack });
    return redirectToError(origin, message, stack);
  }
}

function redirectToError(origin: string, message: string, stack?: string) {
  const params = new URLSearchParams();
  params.set("error", message);
  if (stack && stack.length > 0 && stack.length <= 1500) {
    params.set("stack", stack);
  }
  return NextResponse.redirect(`${origin}/auth/error?${params.toString()}`);
}
