import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

// APIレスポンスの型定義
interface ExpStatusResponse {
  totalExperienceGained: number; // 獲得した合計経験値
  experience: number; // 更新後の総経験値
  level: number; // 更新後のレベル
  leveledUp: boolean; // レベルアップしたかどうか
  newCharacterImage: string | null; // 新しいキャラクター画像
}

// 結果ページコンポーネント
const QuestResultPage: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [expStatus, setExpStatus] = useState<ExpStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // router.queryからクエスト結果の情報を取得
  const { questStatus, bossName, userFinalHp, bossFinalHp, correctDifficulties } = router.query;
  
  // correctDifficultiesは文字列の配列として渡されるため、数値の配列に変換
  const difficulties = correctDifficulties ? (Array.isArray(correctDifficulties) ? correctDifficulties.map(d => parseInt(d as string, 10)) : [parseInt(correctDifficulties as string, 10)]) : [];

  // クエスト完了時の経験値獲得処理
  useEffect(() => {
    // 認証済みかつクエスト成功時のみ実行
    // useEffectの依存関係からexpStatusを削除し、無限ループを防ぐ
    if (status === 'authenticated' && questStatus === 'completed' && expStatus === null) {
      const getExp = async () => {
        try {
          const response = await fetch(window.location.origin + '/api/exp_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: session?.user?.id, correctDifficulties: difficulties }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '経験値の更新に失敗しました。');
          }

          const data: ExpStatusResponse = await response.json();
          setExpStatus(data);
        } catch (err: any) {
          console.error("Failed to update experience:", err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      getExp();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, questStatus, session?.user?.id, JSON.stringify(difficulties)]);

  if (isLoading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-pink-300">
        <div className="text-pink-800 text-2xl font-bold rounded-lg p-6 bg-white shadow-lg animate-pulse">
          {status === 'loading' ? 'セッションを読み込み中... ⏳' : '結果を計算中... 📊'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-pink-300 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg text-center">
          <p className="font-bold mb-2">エラーが発生しました！</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const isSuccess = questStatus === 'completed';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-pink-300 p-4 font-inter text-pink-900">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border-4 border-pink-400">
        <h1 className="text-5xl font-extrabold mb-4 drop-shadow-md">
          {isSuccess ? 'クエスト成功！🎉' : 'クエスト失敗...😢'}
        </h1>

        <p className="text-xl font-medium mb-6">
          {isSuccess ? (
            `強敵「${bossName}」を打ち破りました！おめでとうございます！`
          ) : (
            `強敵「${bossName}」に敗れてしまいました。`
          )}
        </p>

        {isSuccess && expStatus && (
          <div className="bg-pink-50 p-6 rounded-lg my-6 border border-pink-200">
            <h2 className="text-3xl font-bold text-pink-700 mb-2">報酬</h2>
            <p className="text-xl font-semibold text-green-600">
              獲得経験値: {expStatus.totalExperienceGained} EXP ✨
            </p>
            <p className="text-lg mt-2">
              あなたの現在の経験値: {expStatus.experience}
            </p>
            {expStatus.leveledUp && (
              <p className="text-xl font-bold text-purple-600 mt-2">
                レベルアップ！現在のレベル: {expStatus.level} 🚀
              </p>
            )}
          </div>
        )}

        {!isSuccess && (
          <div className="bg-red-50 p-6 rounded-lg my-6 border border-red-200">
            <h2 className="text-3xl font-bold text-red-700 mb-2">結果</h2>
            <p className="text-lg">
              {bossName} のHP: {bossFinalHp}
            </p>
            <p className="text-lg">
              あなたのHP: {userFinalHp}
            </p>
          </div>
        )}

        <button
          onClick={() => router.push('/')} // トップページに戻るなど、任意のページに遷移
          className="mt-8 px-8 py-4 bg-pink-600 text-white font-bold text-xl rounded-full shadow-lg hover:bg-pink-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-300"
        >
          メニューに戻る 🏠
        </button>
      </div>
    </div>
  );
};

export default QuestResultPage;
