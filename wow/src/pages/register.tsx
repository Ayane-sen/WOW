// pages/register.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // 登録成功後、ログインページにリダイレクトしてログインを促す
      router.push('/login');
    } else {
      setError(data.error || '登録に失敗しました。');
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>新規登録</h2>
        {error && <p style={styles.error}>{error}</p>}
        <input type="text" placeholder="ユーザー名" value={username} onChange={(e) => setUsername(e.target.value)} required style={styles.input} />
        <input type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
        <input type="password" placeholder="パスワード (8文字以上)" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
        <button type="submit" style={styles.button}>登録する</button>
        <p style={{ marginTop: '1rem' }}>
          すでにアカウントをお持ちですか？{' '}
          <Link href="/login" style={{ color: '#0070f3' }}>
            ログイン
          </Link>
        </p>
      </form>
    </div>
  );
}

// login.tsxと同じスタイルを再利用
const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' },
  form: { padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  input: { display: 'block', width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc' },
  button: { width: '100%', padding: '0.75rem', border: 'none', borderRadius: '4px', backgroundColor: '#0070f3', color: 'white', fontSize: '1rem', cursor: 'pointer' },
  error: { color: 'red', marginBottom: '1rem' }
};