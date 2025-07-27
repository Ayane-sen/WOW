import React,{useState,useEffect} from 'react';
import {useRouter} from 'next/router';
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
    // router.isReady が true になるまで待つことで、クエリパラメータが確実に利用可能になる
    if (router.isReady) {
      // サンプルユーザーIDを取得するAPIを呼び出す
      const fetchSampleUserIdAndProceed = async () => {
        try {
          // **修正点: サンプルユーザーID取得APIのパスを絶対パスに修正**
          const userResponse = await fetch(window.location.origin + '/api/user-id');
          if (!userResponse.ok) {
            const errorData = await userResponse.json();
            throw new Error(errorData.error || 'ユーザーIDの取得に失敗しました。');
          }
          const userData = await userResponse.json();
          
          // ユーザーIDが取得できたら経験値更新APIを呼び出す
          if (userData.userId) {
            // **修正点: 正解した問題がある場合のみ経験値更新APIを呼び出す**
            // 正解数が0でも、APIは呼ばれるが獲得経験値は0になる
            await updateExperience(userData.userId, parsedCorrectDifficulties);
          } else {
            throw new Error('ユーザーIDが取得できませんでした。');
          }
        } catch (err: any) {
          console.error("Error in fetching user ID or updating experience:", err);
          setUpdateExperienceError(err.message || 'ユーザー情報の取得または経験値更新中にエラーが発生しました。');
          setIsUpdatingExperience(false);
        }
      };
      fetchSampleUserIdAndProceed();
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

                <div className={clsx(mobileStyles.button)}>
                    <MenuButton buttontype="menu">
                      <button onClick={handleBackToHome}>
                        ホームに戻る
                      </button>
                    </MenuButton>
                </div>
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