import React,{useState,useEffect} from 'react';
import {useRouter} from 'next/router';
import { useSession } from 'next-auth/react';
import clsx from "clsx";
import Head from "next/head";
import mobileStyles from "../styles/resultpageStyles/iPhone14.module.css";
import MenuButton from '@/components/Button/Button';

// 経験値加算APIのレスポンスの型定義
interface ExpUpdateResponse {
  userId: number;
  level: number;
  experience: number; // 現在の総経験値
  totalExperienceGained: number; // 今回のクイズで獲得した総経験値
  leveledUp: boolean;
  newCharacterImage: string | null;
  skillUnlocked: string | null;
}

const ResultPage: React.FC=()=>{
    const { data: session, status } = useSession();
    const router=useRouter();
    const{ correctCount, total, correctDifficulties: correctDifficultiesJson} = router.query;

    //数値に変換
    const correctcount=typeof correctCount === 'string' ? parseInt(correctCount, 10) : 0;
    const totalquestions=typeof total === 'string' ? parseInt(total, 10) : 0;
    //JSON文字列として渡された難易度配列をパース
    const parsedCorrectDifficulties: number[] = typeof correctDifficultiesJson === 'string'
        ? JSON.parse(correctDifficultiesJson)
        : [];
    // 経験値更新APIからのレスポンスを保持する状態
    const [expUpdateResult, setExpUpdateResult] = useState<ExpUpdateResponse | null>(null);
    const [isUpdatingExperience, setIsUpdatingExperience] = useState<boolean>(true);
    const [updateExperienceError, setUpdateExperienceError] = useState<string | null>(null);
    // 経験値更新APIを呼び出す関数
    const updateExperience = async (userId: number, difficulties: number[]) => {
        setIsUpdatingExperience(true);
        setUpdateExperienceError(null);
        try {
        //経験値加算APIのパスを絶対パスに
        const response = await fetch(window.location.origin + '/api/exp_status', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            userId: userId,
            correctDifficulties: difficulties,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '経験値の更新に失敗しました。');
        }
        const data: ExpUpdateResponse = await response.json();
        setExpUpdateResult(data);
        } catch (err: any) {
        console.error("Failed to update experience:", err);
        setUpdateExperienceError(err.message || '経験値の更新中にエラーが発生しました。');
        } finally {
        setIsUpdatingExperience(false);
        }
  };

  // ページロード時に経験値更新APIを呼び出す
  useEffect(() => {
    if (router.isReady && status === 'authenticated' && session?.user?.id && !expUpdateResult) {
      const userId = parseInt(session.user.id, 10);
      if (!isNaN(userId)) {
        updateExperience(userId, parsedCorrectDifficulties);
      } else {
        setUpdateExperienceError('ユーザーIDが有効ではありません。');
        setIsUpdatingExperience(false);
      }
    } else if (status === 'unauthenticated') {
      setUpdateExperienceError('認証が必要です。ログインしてください。');
      setIsUpdatingExperience(false);
    }
  }, [router.isReady, correctDifficultiesJson]); // correctDifficultiesJson を依存配列に追加

    //ホームページに戻る
    const handleBackToHome=()=>{
        router.push('/'); // ホームページにリダイレクト
    };
    if(isUpdatingExperience){
        return <div>経験値を更新中...</div>; // 経験値更新中のメッセージ
    }
    return (
      
        <div>
          <head>
            <meta 
              name="viewport" 
              content="width=device-width, initial-scale=1.0, user-scalable=no" 
            />
            <link href="https://fonts.googleapis.com/css2?family=Yomogi&display=swap" rel="stylesheet"></link>
          </head>
          <div className= {clsx(mobileStyles.backgroundSpace)}></div>
          <div className= {clsx(mobileStyles.backgroundShip)}>
            <div className={clsx( mobileStyles.index)}>
            
              <main className={clsx( mobileStyles.main)}>
                <div className={clsx(mobileStyles.imageWrapper)}>
                    <img
                        src="/images/小さい星1.png"
                        alt="小さい星1"
                        className={clsx(mobileStyles.littlestar)}
                    />
                    <img
                        src="/images/小さい星2.png"
                        alt="小さい星2"
                        className={clsx(mobileStyles.littlestar)}
                    />
                    <img
                        src="/images/小さい星3.png"
                        alt="小さい星3"
                        className={clsx(mobileStyles.littlestar)}
                    />
                  <img
                    src="/images/流れ星.png"
                    alt="流れ星"
                    className={clsx(mobileStyles.shootingstar)}
                  />
                </div>

                <MenuButton buttontype="menu">
                  <button className={clsx(mobileStyles.homebutton)} onClick={handleBackToHome}>
                    ホームに戻る
                  </button>
                </MenuButton>
            
                 </main>
        </div>
      </div>

            <h1 className={clsx(mobileStyles.header)}>結果</h1>
            <p className={clsx(mobileStyles.correct)}>正解数: {correctcount} / {totalquestions}</p>

            {expUpdateResult && (
                <div>
                    <p className={clsx(mobileStyles.exp)}>獲得経験値:{expUpdateResult.totalExperienceGained}EXP</p>
                    <p className={clsx(mobileStyles.sumexp)}>経験値: {expUpdateResult.experience}</p>
                    <p className={clsx(mobileStyles.level)}>レベル: {expUpdateResult.level}</p>
                    {expUpdateResult.leveledUp && (
                        <div>
                            <p>レベルアップしました！</p>
                            {expUpdateResult.newCharacterImage && (
                                <img src={expUpdateResult.newCharacterImage} alt="New Character" />
                            )}
                        </div>
                    )}
                </div>
            )}

        </div>
        
    );

};
export default ResultPage;