// pages/login.tsx
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // NextAuthのsignIn関数を呼び出す
    const result = await signIn('credentials', {
      redirect: false, // ページ遷移を自身でコントロールする
      email: email,
      password: password,
    });

    if (result?.ok) {
      // ログイン成功時、トップページへリダイレクト
      router.push('/');
    } else {
      // ログイン失敗時 (ユーザーが存在しない or パスワード間違い)
      // 登録ページへ誘導する
      setError('メールアドレスかパスワードが違います。初めての方はご登録ください。');
    }
  };

  return (
    <div style={styles.container}>
      <div>
        <div style={{ 
            width: '100vw',
            height: '100vw',
            marginBottom: '2rem', 
            textAlign: 'center' 
          }}>
          <Image
            src="/images/title-logo.png"
            alt="WOW タイトルロゴ"
            width={500} // 画像のサイズを調整
            height={333} // 画像のサイズを調整
            priority
          />
        </div>


        <div style={{
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center', 
           
        }}>
          <form onSubmit={handleSubmit} style={styles.form}>
            
            <h2>ログイン</h2>
            {error && <p style={styles.error}>{error}</p>}
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" style={styles.button}>ログイン</button>
            <p style={{ marginTop: '1rem' }}>
              アカウントをお持ちでないですか？{' '}
              <Link href="/register" style={{ color: '#0070f3' }}>
                新規登録
              </Link>
            </p>
          </form>
          </div>
      </div>
    </div>
  );
}

// スタイル定義
const styles: { [key: string]: React.CSSProperties } = {
  container: { 
    display: 'flex', 
    justifyContent: 'center',
    alignItems: 'center', 
    height: '844px', 
    width: '390px',
    backgroundColor: '#f3f4f6',
    padding: '1rem',
  },
  form: { 
    padding: '2rem', 
    backgroundColor: 'white', 
    borderRadius: '8px', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
    width: '100%', 
    maxWidth: '500px' 
  },
  input: { 
    display: 'block', 
    width: '100%',
    padding: '0.75rem', 
    marginBottom: '1rem', 
    borderRadius: '4px', 
    border: '1px solid #ccc' 
  },
  button: { 
    width: '100%', 
    padding: '0.75rem', 
    border: 'none', 
    borderRadius: '4px', 
    backgroundColor: '#0070f3', 
    color: 'white', 
    fontSize: '1rem', 
    cursor: 'pointer' 
  },
  error: { 
    color: 'red', 
    marginBottom: '1rem' 
  }
};