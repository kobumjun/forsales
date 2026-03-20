import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <span className="text-lg font-semibold text-slate-800">DWAD</span>
          <a
            href="/auth/signin"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            로그인
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          스크린샷 한 장으로
          <br />
          실전 답변 3개
        </h1>
        <p className="mt-4 text-center text-lg text-slate-600">
          외주 개발자·프리랜서·세일즈맨을 위한 고객응대 답변 추천
        </p>

        <div className="mt-12 flex justify-center">
          <a
            href="/auth/signin"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-base font-medium text-white hover:bg-brand-700"
          >
            Google로 시작하기
          </a>
        </div>

        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 text-2xl">📸</div>
            <h3 className="font-semibold text-slate-900">스크린샷 업로드</h3>
            <p className="mt-1 text-sm text-slate-600">
              고객 대화 스크린샷을 붙여넣거나 드래그로 업로드
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 text-2xl">⚡</div>
            <h3 className="font-semibold text-slate-900">즉시 분석</h3>
            <p className="mt-1 text-sm text-slate-600">
              OCR + AI로 핵심 요약과 추천 답변 3가지를 생성
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 text-2xl">📋</div>
            <h3 className="font-semibold text-slate-900">복사해서 사용</h3>
            <p className="mt-1 text-sm text-slate-600">
              짧은 답변 / 설명형 / 친절한 답변 중 선택해 바로 복사
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
