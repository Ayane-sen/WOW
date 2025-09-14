import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import clsx from 'clsx'; // clsxをインポート

// 新しいCSSファイルをインポート
import styles from '../styles/questResultStyles.module.css';

// APIレスポンスの型定義 (変更なし)
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
  }, [status, questStatus, session?.user?.id, JSON.stringify(difficulties), expStatus]);

  if (isLoading || status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={clsx(styles.loadingMessage, 'animate-pulse')}>
          {status === 'loading' ? 'セッションを読み込み中... ⏳' : '結果を計算中... 📊'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p className={clsx(styles.errorTitle, 'font-bold', 'mb-2')}>エラーが発生しました！</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const isSuccess = questStatus === 'completed';

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <h1 className={styles.title}>
          <span className={styles.titleQuest}>クエスト</span>
          <br />
          <span className={styles.titleSuccess}>成功！🎉</span>
        </h1>

        <p className={styles.subtitle}>
          {isSuccess ? (
            `強敵「${bossName}」を打ち破りました！おめでとうございます！`
          ) : (
            `強敵「${bossName}」に敗れてしまいました。`
          )}
        </p>

        {isSuccess && expStatus && (
          <div className={clsx(styles.resultPanel, styles.successPanel)}>
            <h2 className={clsx(styles.rewardTitle, 'mb-2')}>報酬</h2>
            <p className={styles.expText}>
              獲得経験値: {expStatus.totalExperienceGained} EXP ✨
            </p>
            <p className={clsx('text-lg', 'mt-2')}>
              あなたの現在の経験値: {expStatus.experience}
            </p>
            {expStatus.leveledUp && (
              <p className={styles.levelUpText}>
                レベルアップ！現在のレベル: {expStatus.level} 🚀
              </p>
            )}
          </div>
        )}

        {!isSuccess && (
          <div className={clsx(styles.resultPanel, styles.failurePanel)}>
            <h2 className={clsx(styles.rewardTitle, 'text-red-700', 'mb-2')}>結果</h2>
            <p className={clsx('text-lg')}>
              {bossName} のHP: {bossFinalHp}
            </p>
            <p className={clsx('text-lg')}>
              あなたのHP: {userFinalHp}
            </p>
          </div>
        )}

        <button
          onClick={() => router.push('/')}
          className={styles.button}
        >
          メニューに戻る 🏠
        </button>
      </div>
    </div>
  );
};

export default QuestResultPage;