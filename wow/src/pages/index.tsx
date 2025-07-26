import styles from "./index.module.css";
import UserProfile from "./userProfile";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LoginButton from './loginButton';
import { useSession } from "next-auth/react";

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
  const [userData, setUserData] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [session, status]);

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
          <p>これはWOWうさぎです。</p>
          <p>みちみちin</p>
        </div>

        {/* ユーザーステータス表示 */}
        {/* 1. ログイン状態をチェック中 */}
        {status === 'loading' && <p>セッション情報を読み込み中...</p>}

        {/* 2. ログインしていない場合 */}
        {status === 'unauthenticated' && (
          <div className={styles.card}>
            <h2>ようこそ！</h2>
            <p>ログインすると、あなたのキャラクターステータスが表示されます。</p>
            <p>まずはログインまたは新規登録をしてください。</p>
          </div>
        )}

        {/* 3. ログインしている場合 */}
        {status === 'authenticated' && (
          <>
            <div className={styles.card}>
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
            </div>
          </>
        )}
      </main>
    </div>
  );
};
