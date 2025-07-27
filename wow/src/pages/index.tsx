/*npm install clsxが必要 */
import Link from 'next/link'; 
import Image from "next/image";
import Head from "next/head";
import clsx from "clsx";

import baseStyles from "../styles/toppageStyles/index.module.css";
import mobileStyles from "../styles/toppageStyles/iPhone14.module.css";
import styles from "./index.module.css";
import UserProfile from "./userProfile";
import { useState, useEffect } from 'react';
import LoginButton from './loginButton';
import { useSession } from "next-auth/react";
import { redirect } from 'next/dist/server/api-utils';
import { useRouter } from 'next/router';


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
  const router =useRouter();


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
    <>
      <Head>
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, user-scalable=no" 
        />
        <title>WOW</title>
      </Head>
      <div className= {clsx(mobileStyles.backgroundSpace)}>
        <div className= {clsx(mobileStyles.whiteStars)}></div>  
        <div className= {clsx(mobileStyles.planet,mobileStyles.Earth)}></div> 
        <div className= {clsx(mobileStyles.Sun)}></div> 
        <div className= {clsx(mobileStyles.planet,mobileStyles.Jupiter)}></div> 
        <div className= {clsx(mobileStyles.planet,mobileStyles.Mars)}></div> 
      </div>

      <div className= {clsx(mobileStyles.buttonContainer)}>
        <div className= {clsx(mobileStyles.RedButtons)}
        onClick= {()=> router.push('/')} />
        <div className= {clsx(mobileStyles.GreenButtons)}
        onClick= {() => router.push('/')} />
        <div className= {clsx(mobileStyles.BlueButtons)}
        onClick= {() => router.push('/question')} />
      </div>

        <div className= {clsx(mobileStyles.nameOfButtons)}>

          <div className= {clsx(mobileStyles.backgroundShip)}>
            <div className={clsx(baseStyles.index, mobileStyles.index)}>
            
              <main className={clsx(baseStyles.main, mobileStyles.main)}>
                
                <div className={clsx(baseStyles.imageWrapper, mobileStyles.imageWrapper)}>
                  <img
                    src="/images/宇宙人ピンク.gif"
                    alt="宇宙のキャラクター"
                    className={clsx(baseStyles.character, mobileStyles.character)}
                  />
                </div>
                  <div className={styles.index}>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                      <LoginButton />
                    </div>

                  <div className={styles.main}>
                      {/* ユーザーステータス表示 */}
                      {/* 1. ログイン状態をチェック中 */}
                      {status === 'loading' && <p>セッション情報を読み込み中...</p>}

                      {/* 2. ログインしていない場合 */}
                      {status === 'unauthenticated' && (
                        <div className={styles.card}>
                          <p>まずはログインまたは新規登録をしてください。</p>
                        </div>
                      )}

                      {/* 3. ログインしている場合 */}
                      {status === 'authenticated' && (
                        <>
                          {/*<div className={styles.card}>
                            <UserProfile
                              userData={userData}
                              loading={loading}
                              error={error}
                            />
                          </div>*/}

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
                  </div>

                </div>
              </main>
        </div>
        </div>
      </div>
    </>
  );
};
