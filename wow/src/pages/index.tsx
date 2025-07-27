/*npm install clsxが必要 */
import { useState } from "react";
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
import { redirect } from 'next/dist/server/api-utils';
import { useRouter } from 'next/router';
import Buttons from '@/components/Button/Button'; 


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

  const defaultGif = "/images/characterDefault.gif";
  const winkGif = "/images/characterWink.gif";


  const [currentGif, setCurrentGif] = useState(defaultGif);


  const handleClick = () => {
    if (currentGif === winkGif) return;
    setCurrentGif(winkGif);
    // 1回再生ぶん待ってから戻すにょ(3秒）
    setTimeout(() => {
      setCurrentGif(defaultGif);
    }, 3000);
  };
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
        <div className= {clsx(mobileStyles.RedButtons)} onClick= {()=> router.push('/')}>
            クエスト
        </div>
        <div className= {clsx(mobileStyles.GreenButtons)} onClick= {() => router.push('/')} >
          ガチャ
        </div>
        <div className= {clsx(mobileStyles.BlueButtons)} onClick= {() => router.push('/question')} >
      問題を解く
        </div>
      </div>

      

        <div className= {clsx(mobileStyles.nameOfButtons)}>

          <div className= {clsx(mobileStyles.backgroundShip)}>
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
                  

              </main>
            </div>
          </div>
        </div>
      
    </>
  );
}