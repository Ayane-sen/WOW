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

                <div style={{position:"relative", width:"390px", height:"844px"}}>
                  <Link href="/create">
                  <button className={mobileStyles.button} 
                  style={{
                    position:"absolute",
                    width:"50%",
                    height:"50%",
                    bottom:"0%",
                    left:"0%",
                    transform:"translateX(-50%)",
                    zIndex: 100, 
                    background: "transparent",
                    }}>
                    <img
                      src={"/images/nameOfGreen.png"}
                      alt="緑ボタン"
                      onClick={handleClick}
                      style={{ 
                        width: "100%",
                        height: "auto",
                        cursor: "pointer" }}
                      className={clsx(baseStyles.character, mobileStyles.character)}
                    />
                  </button>
                </Link>
                <Link href="/question">
                  <button className={mobileStyles.button} style={{ 
                    position:"absolute",
                    width:"50%",
                    height:"50%",
                    bottom:"50%",
                    right:"20%",
                    zIndex: 100, 
                    background: "transparent",
                    }}>
                    <img
                      src={"/images/nameOfBlue.png"}
                      alt="青ボタン"
                      onClick={handleClick}
                      style={{ 
                        width: "100%",
                        height: "auto",
                        cursor: "pointer"}}
                      className="{clsx(baseStyles.character, mobileStyles.character)}"
                    />
                    </button>
                </Link>
                <Link href="/quest">
                  <button className={mobileStyles.button} 
                  style={{
                    position: "absolute",
                    top: "20%",
                    left: "30%",
                    transform: "translateX(-50%)",
                    width: "50%",
                    height: "50%",                
                    zIndex: 100,
                    background: "transparent",
                    }}>
                    <img
                      src={"/images/nameOfRed.png"}
                      alt="赤ボタン"
                      onClick={handleClick}
                      style={{ 
                        width: "100%",
                        height: "auto",
                        cursor: "pointer"}}
                      className="{clsx(baseStyles.character, mobileStyles.character)}"
                    />
                   </button>
                </Link>
                </div>

                
              </main>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 999 }}>
        <LoginButton />
      </div>
      
    </>
  );
}