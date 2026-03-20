import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
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
              href="/presets"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              프리셋
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
        <DashboardClient />
      </main>
    </div>
  );
}
