/*npm install clsxが必要 */
import { useState, useEffect } from "react";
import Link from 'next/link'; 
import Image from "next/image";
import Head from "next/head";
import clsx from "clsx";

import baseStyles from "../styles/toppageStyles/index.module.css";
import mobileStyles from "../styles/toppageStyles/iPhone14.module.css";
import styles from "./index.module.css";
import UserProfile from "./userProfile";
import LoginButton from './loginButton';
import { useSession } from "next-auth/react";
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
  const router = useRouter();
  const [userData, setUserData] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const defaultGif = "/images/characterDefault.gif";
  const winkGif = "/images/characterWink.gif";

  const [currentGif, setCurrentGif] = useState(defaultGif);

  // 認証状態を監視し、未認証ならログインページにリダイレクトする useEffect
  useEffect(() => {
    if (status === 'loading') {
      // セッションの読み込み中は何もせず待機
      return;
    }

    if (status === 'unauthenticated') {
      // 未認証の場合、ログインページにリダイレクト
      router.push('/login');
    }
    // 'authenticated' の場合は、このコンポーネントのレンダリングを続行
  }, [status, router]);

  const handleClick = () => {
    if (currentGif === winkGif) return;
    setCurrentGif(winkGif);
    // 1回再生ぶん待ってから戻すにょ(3秒）
    setTimeout(() => {
      setCurrentGif(defaultGif);
    }, 3000);
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return <div>読み込み中...</div>;
  }

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
          <div className= {clsx(mobileStyles.backgroundShip)} style={{ zIndex: 0 }}>
            <div className={clsx(baseStyles.index, mobileStyles.index)}>
            
              <main className={clsx(baseStyles.main, mobileStyles.main)}>
                
                <div className={clsx(baseStyles.imageWrapper, mobileStyles.imageWrapper)}>
                  <img
                    src={currentGif}
                    alt="宇宙のキャラクター"
                    onClick={handleClick}
                    style={{ cursor: "pointer" }}
                    className={clsx(baseStyles.character, mobileStyles.character)}
                  />
                </div>

                <Link href="/create">
                  <button className={mobileStyles.button} style={{ zIndex: 100 }}>新しい単語を追加</button>
                </Link>
                <Link href="/question">
                  <button className={mobileStyles.button} style={{ zIndex: 100 }}>問題を解く</button>
                </Link>
                <Link href="/quest">
                  <button className={mobileStyles.button} style={{ zIndex: 100 }}>クエスト</button>
                </Link>

                
              </main>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 999 }}>
        <LoginButton />
      </div>
      
    </>
  );
}