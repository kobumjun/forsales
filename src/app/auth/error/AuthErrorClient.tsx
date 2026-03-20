"use client";

import { useEffect } from "react";

export function AuthErrorClient({
  errorMessage,
  stack,
}: {
  errorMessage: string;
  stack?: string;
}) {
  useEffect(() => {
    // 사용자 UI에는 메시지만 보여주고, stack은 콘솔에만 출력합니다.
    console.error("[auth/error] errorMessage:", errorMessage);
    if (stack) console.error("[auth/error] stack:", stack);
  }, [errorMessage, stack]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <h1 className="text-xl font-semibold text-slate-900">로그인 실패</h1>
      <p className="mt-2 w-full max-w-xl whitespace-pre-wrap text-sm text-slate-700">
        {errorMessage}
      </p>
      <a
        href="/"
        className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
      >
        홈으로 돌아가기
      </a>
    </div>
  );
}

