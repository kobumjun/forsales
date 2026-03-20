import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export async function createClient(response?: NextResponse) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: object }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Route handler에서 NextResponse가 제공되면 거기에 쿠키를 세팅하고,
            // 제공되지 않으면 next/headers의 cookies()에 세팅합니다.
            if (response) {
              response.cookies.set(name, value, options as any);
              return;
            }

            try {
              cookieStore.set(name, value, options as any);
            } catch {
              // Next.js 제한상 서버 컴포넌트에서는 쿠키 수정이 불가합니다.
              // 여기서는 쿠키 쓰기 실패를 무시합니다.
            }
          });
        },
      },
    }
  );
}
