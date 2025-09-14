import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import clsx from 'clsx';
import styles from '../styles/questStyles.module.css';

// APIレスポンスの型定義 (変更なし)
interface BossData {
  id: number;
  name: string;
  initialHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  imageUrl: string | null;
}

interface UserStatusData {
  userId: number;
  currentHp: number;
  currentLevel: number;
  attackPower: number;
  defensePower: number;
  characterImage: string | null;
}

interface ProblemData {
  wordId: number;
  question: string;
  options: string[];
  correctAnswer: string;
  difficultyLevel: number;
}

interface QuestStartResponse {
  questSessionId: number;
  boss: BossData;
  userStatus: UserStatusData & { initialHp: number };
  currentProblem: ProblemData;
}

interface QuestAnswerResponse {
  questSession: {
    id: number;
    userCurrentHp: number;
    bossCurrentHp: number;
    questStatus: string;
  };
  damageDealtToBoss: number;
  damageTakenByUser: number;
  newBossHp: number;
  newUserHp: number;
  questStatus: string;
  nextProblem: ProblemData | null;
}

const QuestPage: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // クエストの状態管理 (変更なし)
  const [questSessionId, setQuestSessionId] = useState<number | null>(null);
  const [bossData, setBossData] = useState<BossData | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatusData | null>(null);
  const [currentProblem, setCurrentProblem] = useState<ProblemData | null>(null);
  const [currentProblemNumber, setCurrentProblemNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState<boolean>(false);
  const [questFinishedStatus, setQuestFinishedStatus] = useState<string | null>(null);
  const [damageDealtToBoss, setDamageDealtToBoss] = useState<number | null>(null);
  const [damageTakenByUser, setDamageTakenByUser] = useState<number | null>(null);
  const [correctDifficulties, setCorrectDifficulties] = useState<number[]>([]);

  // クエスト開始処理 (変更なし)
  const startQuest = async () => {
    setIsLoading(true);
    setError(null);
    setQuestFinishedStatus(null);
    setQuestSessionId(null);
    setBossData(null);
    setUserStatus(null);
    setCurrentProblem(null);
    setCurrentProblemNumber(1);
    setSelectedAnswer(null);
    setFeedback(null);
    setIsProcessingAnswer(false);
    setDamageDealtToBoss(null);
    setDamageTakenByUser(null);
    setCorrectDifficulties([]);

    try {
      if (status !== 'authenticated' || !session?.user?.id) {
        return;
      }
      const response = await fetch(window.location.origin + '/api/quest/start');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'クエストの開始に失敗しました。');
        console.error("Failed to start quest:", errorData);
      }
      const data: QuestStartResponse = await response.json();

      setQuestSessionId(data.questSessionId);
      setBossData(data.boss);
      setUserStatus(data.userStatus);
      setCurrentProblem(data.currentProblem);
    } catch (err: any) {
      console.error("Failed to start quest:", err);
      setError(err.message || 'クエストの開始中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 解答選択ハンドラー (変更なし)
  const handleAnswerSelect = async (answer: string) => {
    if (selectedAnswer || isProcessingAnswer) return;

    setSelectedAnswer(answer);
    setIsProcessingAnswer(true);

    const isCorrect = answer === currentProblem?.correctAnswer;
    setFeedback(isCorrect ? '🎉 正解！' : `残念！正解は「${currentProblem?.correctAnswer}」でした。`);

    if (isCorrect && currentProblem?.difficultyLevel) {
      setCorrectDifficulties(prev => [...prev, currentProblem.difficultyLevel]);
    }

    if (!questSessionId || !currentProblem || !userStatus) {
      setError('クエスト情報が不足しています。');
      setIsProcessingAnswer(false);
      return;
    }

    try {
      const response = await fetch(window.location.origin + '/api/quest/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questSessionId: questSessionId,
          wordId: currentProblem.wordId,
          userAnswer: answer,
          isCorrect: isCorrect,
          userCurrentHp: userStatus.currentHp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '解答の送信に失敗しました。');
      }
      const data: QuestAnswerResponse = await response.json();

      setBossData(prev => prev ? { ...prev, currentHp: data.newBossHp } : null);
      setUserStatus(prev => prev ? { ...prev, currentHp: data.newUserHp } : null);

      setDamageDealtToBoss(data.damageDealtToBoss);
      setDamageTakenByUser(data.damageTakenByUser);

      const nextProblemNumber = currentProblemNumber + 1;

      if (data.questStatus !== "ongoing") {
        setQuestFinishedStatus(data.questStatus);
      } else if (nextProblemNumber > 10) {
        setQuestFinishedStatus("completed");
      } else {
        setCurrentProblem(data.nextProblem);
        setCurrentProblemNumber(prev => prev + 1);
      }
    } catch (err: any) {
      console.error("Failed to submit answer:", err);
      setError(err.message || '解答の送信中にエラーが発生しました。');
    } finally {
      setIsProcessingAnswer(false);
    }
  };

  // 次の問題へ進むボタン (変更なし)
  const handleNextProblemOrEndQuest = () => {
    if (questFinishedStatus) {
      router.push({
        pathname: '/quest_result',
        query: {
          questStatus: questFinishedStatus,
          bossName: bossData?.name || 'ボス',
          bossFinalHp: bossData?.currentHp || 0,
          userFinalHp: userStatus?.currentHp || 0,
          correctDifficulties: correctDifficulties,
        },
      });
    } else {
      setSelectedAnswer(null);
      setFeedback(null);
      setDamageDealtToBoss(null);
      setDamageTakenByUser(null);
    }
  };

  // useEffect (変更なし)
  useEffect(() => {
    if (status === 'authenticated') {
      startQuest();
    } else if (status === 'unauthenticated') {
      setError('ログインが必要です。クエストをプレイするにはログインしてください。');
      setIsLoading(false);
    }
  }, [status]);

  // UIレンダリング
  if (isLoading || status === 'loading') {
    return (
      <div className={clsx(styles.container, styles.loadingScreen)}>
        <div className={styles.loadingMessage}>
          {status === 'loading' ? 'セッションを読み込み中... ⏳' : 'クエストを準備中... ⚔️'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p className={styles.errorTitle}>エラーが発生しました！</p>
          <p>{error}</p>
          {status === 'unauthenticated' ? (
            <button
              onClick={() => signIn()}
              className={styles.loginButton}
            >
              ログインする
            </button>
          ) : (
            <button
              onClick={startQuest}
              className={styles.retryButton}
            >
              もう一度クエストを開始する
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!questSessionId || !bossData || !userStatus || !currentProblem) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          クエストデータがありません。
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={clsx(styles.mainContent, 'relative')}>

        <div className={styles.hpBarContainer}>
          <div className={styles.bossBox}>
            <img src={bossData.imageUrl || 'https://placehold.co/80x80/FF0000/FFFFFF?text=BOSS'} alt={bossData.name} className={clsx(styles.avatar, styles.bossAvatar)} />
            <p className={clsx(styles.name, styles.bossName)}>{bossData.name}</p>
            <div className={styles.hpBar}>
              <div
                className={styles.bossHpBarFill}
                style={{ width: `${(bossData.currentHp / bossData.initialHp) * 100}%` }}
              ></div>
            </div>
            <p className={styles.hpText}>{bossData.currentHp} / {bossData.initialHp} HP</p>
          </div>

          <span className="text-2xl font-bold text-gray-400">VS</span>

          <div className={styles.playerBox}>
            <img src={'/images/characterDefault.gif'} alt="あなたのキャラ" className={clsx(styles.avatar, styles.userAvatar)} />
            <p className={clsx(styles.name, styles.userName)}>あなた (Lv.{userStatus.currentLevel})</p>
            <div className={styles.hpBar}>
              <div
                className={styles.userHpBarFill}
                style={{ width: `${(userStatus.currentHp / (userStatus.currentHp + (userStatus.currentHp - (userStatus.currentHp || 0)))) * 100}%` }}
              ></div>
            </div>
            <p className={styles.hpText}>{userStatus.currentHp} HP</p>
          </div>
        </div>
        <p className={styles.questionNumber}>
          問題 {currentProblemNumber}
        </p>

        <p className={styles.questionBox}>
          「<span className={styles.questionText}>{currentProblem.question}</span>」に合う単語は何でしょう？
        </p>

        <div className={styles.optionGrid}>
          {currentProblem.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={!!selectedAnswer || isProcessingAnswer}
              className={clsx(styles.optionButton, {
                [styles.correct]: selectedAnswer === option && option === currentProblem.correctAnswer,
                [styles.wrong]: selectedAnswer === option && option !== currentProblem.correctAnswer,
              })}
            >
              {option}
            </button>
          ))}
        </div>

        {feedback && (
          <div className={clsx(styles.feedbackMessage, {
            [styles.correctFeedback]: selectedAnswer === currentProblem.correctAnswer,
            [styles.wrongFeedback]: selectedAnswer !== currentProblem.correctAnswer,
          })}>
            {feedback}
            {damageDealtToBoss !== null && damageTakenByUser === 0 && (
              <p className="mt-2 text-white">⚔️ ボスに **{damageDealtToBoss}** ダメージ与えました！</p>
            )}
            {damageTakenByUser !== null && damageDealtToBoss === 0 && (
              <p className="mt-2 text-white">💥 ユーザーは **{damageTakenByUser}** ダメージ受けました！</p>
            )}
          </div>
        )}

        {selectedAnswer && (
          <button
            onClick={handleNextProblemOrEndQuest}
            disabled={isProcessingAnswer}
            className={styles.nextButton}
          >
            {questFinishedStatus ? '結果を見る ✅' : '次の問題へ ➡️'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestPage;