import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <h1 className="text-xl font-semibold text-slate-900">
        로그인 중 오류가 발생했습니다
      </h1>
      <p className="mt-2 text-slate-600">
        Google 로그인 설정을 확인해 주세요.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
