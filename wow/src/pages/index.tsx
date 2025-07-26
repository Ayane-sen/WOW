import styles from "./index.module.css";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/router';

import UserProfile from "./userProfile";
import LoginButton from './loginButton';

// APIから受け取るデータの型を定義
interface UserStatus {
  userId: number;
  currentLevel: number;
  currentExperience: number;
  status: {
    characterImage: string;
    attackPower: number;
    defensePower: number;
    hp: number;
  } | null;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      return; // ローディング中は何もしない
    }
    if (status === 'unauthenticated') {
      // 未認証の場合はログインページにリダイレクト
      router.push('/login');
      return;
    }
    // ログイン済み(authenticated)で、かつユーザーIDが存在する場合のみデータを取得
    if (status === 'authenticated' && session) {
      const fetchUserData = async () => {
        setLoading(true); // データ取得開始
        try {
          // セッションから取得したIDを使用
          const userId = session.user.id;
          const response = await fetch(`/api/user/${userId}/gamestatus`);
          
          if (!response.ok) {
            throw new Error('データの取得に失敗しました');
          }
          const data = await response.json();
          setUserData(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false); // データ取得完了
        }
      };

      fetchUserData();
    } else {
      // ログインしていない、またはセッション読み込み中の場合はデータをクリア
      setUserData(null);
      setLoading(false);
    }
  }, [session, status, router]);

  // ローディング中またはリダイレクト待ちの表示
  if (status !== 'authenticated' || loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className={styles.index}>
       <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <LoginButton />
      </div>

      <main className={styles.main}>
        {/* キャラクター表示 */}
        <div className={styles.header}>
          <h1>WOW</h1>
          <img 
            src={userData?.status?.characterImage || '/ハッカソンsmpl.gif'}
            alt="キャラクター"
            width={200}
            height={150}
          />
        </div>

        <div>
          <UserProfile
            userData={userData}
            loading={loading}
            error={error}
          />
        </div>

        <div className={styles.menu}>
          <Link href="/create" className={styles.menuButton}>
            新しい単語を追加
          </Link>
          <Link href="/question" className={styles.menuButton}>
            問題を解く
          </Link>
          <Link href="/quest" className={styles.menuButton}>
            クエスト
          </Link>
        </div>
      </main>
    </div>
  );
};
