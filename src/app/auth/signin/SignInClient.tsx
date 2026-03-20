"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignInClient() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 이미 로그인된 사용자가 /auth/signin으로 들어오면 대시보드로 이동
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.assign("/dashboard");
    });
  }, [supabase]);

  async function startOAuth() {
    setError(null);
    setLoading(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const redirectTo = `${baseUrl.replace(/\/$/, "")}/auth/callback`;

      const { data, error: signInError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
          },
        });

      if (signInError) {
        throw signInError;
      }

      if (data?.url) {
        window.location.assign(data.url);
      } else {
        setError("Google OAuth 시작 URL을 가져오지 못했습니다.");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "OAuth 시작 실패";
      setError(message);
      console.error("[auth/signin] OAuth start error:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-center text-lg font-semibold text-slate-900">
          Google 로그인
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          외주 고객응대 답변 추천을 위해 로그인합니다.
        </p>

        <button
          type="button"
          onClick={startOAuth}
          disabled={loading}
          className="mt-6 w-full rounded-md bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "로그인 진행 중..." : "Google로 로그인"}
        </button>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-wrap">
            {error}
          </div>
        )}

        <a
          href="/"
          className="mt-4 block text-center text-sm text-slate-500 hover:text-slate-700"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}

