import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PresetsClient } from "./PresetsClient";

export default async function PresetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <a href="/dashboard" className="text-lg font-semibold text-slate-800">
            DWAD
          </a>
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              대시보드
            </a>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <PresetsClient />
      </main>
    </div>
  );
}
