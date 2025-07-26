import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from 'next/router';

export default function LoginButton() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ローディング中
  if (status === "loading") {
    return <p>Loading...</p>
  }

  // ログインしている場合
  if (session) {
    return (
      <div style={{ textAlign: 'right' }}>
        <p>ようこそ, {session.user?.name} さん</p>
        <button onClick={() => signOut()}>ログアウト</button>
      </div>
    );
  }

  // signIn()を直接呼ばず、/loginページに遷移させる
  return (
    <div style={{ textAlign: 'right' }}>
      <button onClick={() => router.push('/login')}>ログイン / 新規登録</button>
    </div>
  );
}