import { AuthErrorClient } from "./AuthErrorClient";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams?: { error?: string; stack?: string };
}) {
  const errorMessage =
    searchParams?.error ?? "로그인 중 오류가 발생했습니다.";
  const stack = searchParams?.stack;

  return (
    <AuthErrorClient errorMessage={errorMessage} stack={stack} />
  );
}
