import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const supabaseWithRedirect = await createClient();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback`,
    },
  });

  if (data?.url) {
    redirect(data.url);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-slate-600">로그인 진행 중...</p>
        <a
          href="/"
          className="mt-4 inline-block text-sm text-brand-600 hover:underline"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}
