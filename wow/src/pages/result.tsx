import React,{useState,useEffect} from 'react';
import {useRouter} from 'next/router';
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
            <h1>クイズ結果</h1>
            <p>正解数: {correctcount} / {totalquestions}</p>

            {expUpdateResult && (
                <div>
                    <p>獲得経験値:{expUpdateResult.totalExperienceGained} EXP</p>
                    <p>経験値: {expUpdateResult.experience}</p>
                    <p>レベル: {expUpdateResult.level}</p>
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
            <button onClick={handleBackToHome}>ホームに戻る</button>
        </div>
    );

};
export default ResultPage;