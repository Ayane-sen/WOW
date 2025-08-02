import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import { init } from 'next/dist/compiled/webpack/webpack';

// APIレスポンスの型定義
interface BossData {
  id: number;
  name: string;
  initialHp: number;
  currentHp: number; // クエスト中の現在のHP
  attack: number;
  defense: number;
  imageUrl: string | null;
}

interface UserStatusData {
  userId: number;
  currentHp: number; // クエスト中の現在のHP
  currentLevel: number;
  attackPower: number;
  defensePower: number;
  characterImage: string | null;
}

interface ProblemData {
  wordId: number;
  question: string; // 問題の意味
  options: string[]; // 選択肢の単語
  correctAnswer: string; // 正解の単語
  difficultyLevel: number;
}

interface QuestStartResponse {
  questSessionId: number;
  boss: BossData;
  userStatus: UserStatusData &{initialHp: number}; // 初期HPも含む  
  currentProblem: ProblemData;
}

interface QuestAnswerResponse {
  questSession: {
    id: number;
    userCurrentHp: number;
    bossCurrentHp: number;
    questStatus: string; // "ongoing", "completed", "failed"
  };
  damageDealtToBoss: number;
  damageTakenByUser: number;
  newBossHp: number;
  newUserHp: number;
  questStatus: string;
  nextProblem: ProblemData | null; // クエストが継続する場合のみ
}

const QuestPage: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // クエストの状態を管理するステート
  const [questSessionId, setQuestSessionId] = useState<number | null>(null);
  const [bossData, setBossData] = useState<BossData | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatusData | null>(null);
  const [currentProblem, setCurrentProblem] = useState<ProblemData | null>(null);
  const [currentProblemNumber, setCurrentProblemNumber] = useState<number>(1); // 何問目か表示用

  // UIの状態管理
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState<boolean>(false); // 解答処理中
  const [questFinishedStatus, setQuestFinishedStatus] = useState<string | null>(null); // "completed" or "failed"

  // ダメージ表示用
  const [damageDealtToBoss, setDamageDealtToBoss] = useState<number | null>(null);
  const [damageTakenByUser, setDamageTakenByUser] = useState<number | null>(null);

  // 正解した問題の難易度レベル
  const [correctDifficulties, setCorrectDifficulties] = useState<number[]>([]);


  // --- クエスト開始処理 ---
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
        // 認証されていない場合はここで処理を中断し、useEffectでログインを促す
        return;
      }

      const response = await fetch(window.location.origin + '/api/quest/start');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'クエストの開始に失敗しました。');
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

  // --- 解答選択ハンドラー ---
  const handleAnswerSelect = async (answer: string) => {
    if (selectedAnswer || isProcessingAnswer) return; // すでに回答済みか処理中なら何もしない

    setSelectedAnswer(answer);
    setIsProcessingAnswer(true); // 解答処理開始

    const isCorrect = answer === currentProblem?.correctAnswer;
    setFeedback(isCorrect ? '🎉 正解！' : `残念！正解は「${currentProblem?.correctAnswer}」でした。`);

    // 正解した問題の難易度をリストに追加
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
          userCurrentHp: userStatus.currentHp, // 現在のユーザーHPを渡す
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '解答の送信に失敗しました。');
      }
      const data: QuestAnswerResponse = await response.json();

      // HPを更新
      setBossData(prev => prev ? { ...prev, currentHp: data.newBossHp } : null);
      setUserStatus(prev => prev ? { ...prev, currentHp: data.newUserHp } : null);

      // ダメージ情報を更新
      setDamageDealtToBoss(data.damageDealtToBoss);
      setDamageTakenByUser(data.damageTakenByUser);

      // 次の問題番号を計算
      const nextProblemNumber = currentProblemNumber + 1;

      // クエスト終了判定
      if (data.questStatus !== "ongoing") {
        setQuestFinishedStatus(data.questStatus); // "completed" or "failed"
      } else if (nextProblemNumber > 10) {
        // HPが残っていれば成功とみなす
        setQuestFinishedStatus("completed");
      }else {
        // 次の問題をセット
        setCurrentProblem(data.nextProblem);
        setCurrentProblemNumber(prev => prev + 1); // 問題数をインクリメント
      }

    } catch (err: any) {
      console.error("Failed to submit answer:", err);
      setError(err.message || '解答の送信中にエラーが発生しました。');
    } finally {
      setIsProcessingAnswer(false); // 解答処理終了
    }
  };

  // 次の問題へ進むボタン（またはクエスト終了）
  const handleNextProblemOrEndQuest = () => {
    if (questFinishedStatus) {
      // クエストが終了した場合、ResultPageへ遷移
      router.push({
        pathname: '/quest_result',
        query: {
          questStatus: questFinishedStatus,
          bossName: bossData?.name || 'ボス',
          bossFinalHp: bossData?.currentHp || 0,
          userFinalHp: userStatus?.currentHp || 0,
          correctDifficulties: correctDifficulties,
          // 必要に応じて、獲得経験値やレベルアップ情報も渡す
        },
      });
    } else {
      // 次の問題へ進む
      setSelectedAnswer(null);
      setFeedback(null);
      // currentProblemはsubmitAnswerで既に更新されている
      setDamageDealtToBoss(null);
      setDamageTakenByUser(null);
    }
  };

  // --- useEffect: 初期ロードと認証状態の監視 ---
  useEffect(() => {
    if (status === 'authenticated') {
      startQuest(); // 認証済みならクエスト開始
    } else if (status === 'unauthenticated') {
      setError('ログインが必要です。クエストをプレイするにはログインしてください。');
      setIsLoading(false);
    }
  }, [status]); // 認証ステータスが変更されたときに実行

  // --- UIレンダリング ---
  if (isLoading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-pink-300">
        <div className="text-pink-800 text-2xl font-bold rounded-lg p-6 bg-white shadow-lg animate-pulse">
          {status === 'loading' ? 'セッションを読み込み中... ⏳' : 'クエストを準備中... ⚔️'}
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
          {status === 'unauthenticated' ? (
            <button
              onClick={() => signIn()}
              className="mt-4 px-6 py-3 bg-pink-500 text-white font-semibold rounded-full shadow-md hover:bg-pink-600 transition duration-300 ease-in-out transform hover:scale-105"
            >
              ログインする
            </button>
          ) : (
            <button
              onClick={startQuest}
              className="mt-4 px-6 py-3 bg-pink-500 text-white font-semibold rounded-full shadow-md hover:bg-pink-600 transition duration-300 ease-in-out transform hover:scale-105"
            >
              もう一度クエストを開始する
            </button>
          )}
        </div>
      </div>
    );
  }

  // クエストデータがない場合
  if (!questSessionId || !bossData || !userStatus || !currentProblem) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-pink-300">
        <div className="text-pink-800 text-2xl font-bold rounded-lg p-6 bg-white shadow-lg">
          クエストデータがありません。
        </div>
      </div>
    );
  }

  // --- メインのクエストUI ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-pink-300 p-4 font-inter">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border-4 border-pink-400">
        <h1 className="text-4xl font-extrabold text-pink-700 mb-6 drop-shadow-md">
          クエストに挑戦！ ⚔️
        </h1>

        {/* ボスとユーザーのHPバー */}
        <div className="flex justify-around items-center mb-6">
          {/* ボス */}
          <div className="flex flex-col items-center">
            <img src={bossData.imageUrl || 'https://placehold.co/80x80/FF0000/FFFFFF?text=BOSS'} alt={bossData.name} className="w-20 h-20 rounded-full object-cover border-2 border-red-500 mb-2" />
            <p className="font-bold text-red-700">{bossData.name}</p>
            <div className="w-24 bg-gray-200 rounded-full h-3">
              <div
                className="bg-red-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(bossData.currentHp / bossData.initialHp) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{bossData.currentHp} / {bossData.initialHp} HP</p>
          </div>

          {/* vs */}
          <span className="text-2xl font-bold text-gray-500">VS</span>

          {/* ユーザー */}
          <div className="flex flex-col items-center">
            <img src={userStatus.characterImage || 'https://placehold.co/80x80/800080/FFFFFF?text=YOU'} alt="あなたのキャラ" className="w-20 h-20 rounded-full object-cover border-2 border-purple-500 mb-2" />
            <p className="font-bold text-purple-700">あなた (Lv.{userStatus.currentLevel})</p>
            <div className="w-24 bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(userStatus.currentHp / (userStatus.currentHp + (userStatus.currentHp - (userStatus.currentHp || 0)))) * 100}%` }} // HP計算を修正
              ></div>
            </div>
            <p className="text-sm text-gray-600">{userStatus.currentHp} HP</p>
          </div>
        </div>

        {/* 問題番号 */}
        <p className="text-xl text-gray-600 mb-4">
          問題 {currentProblemNumber}
        </p>

        {/* 問題文 */}
        <p className="text-2xl font-semibold text-gray-800 mb-8 p-4 bg-pink-50 rounded-lg border border-pink-200">
          「<span className="text-pink-600">{currentProblem.question}</span>」に合う単語は何でしょう？
        </p>

        {/* 選択肢ボタン */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {currentProblem.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={!!selectedAnswer || isProcessingAnswer} // 解答済みか処理中なら無効化
              className={`
                w-full py-3 px-4 rounded-xl text-lg font-medium transition duration-300 ease-in-out transform hover:scale-105
                ${selectedAnswer === option
                  ? (option === currentProblem.correctAnswer ? 'bg-green-500 text-white shadow-lg' : 'bg-red-500 text-white shadow-lg')
                  : 'bg-pink-200 text-pink-800 hover:bg-pink-300'
                }
                ${selectedAnswer && option === currentProblem.correctAnswer && selectedAnswer !== option ? 'border-2 border-green-500' : ''}
                ${selectedAnswer || isProcessingAnswer ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
              `}
            >
              {option}
            </button>
          ))}
        </div>

        {/* フィードバックメッセージ */}
        {feedback && (
          <div className={`
            mt-6 p-4 rounded-lg text-xl font-bold
            ${selectedAnswer === currentProblem.correctAnswer ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}
          `}>
            {feedback}
            {/* ダメージ情報を表示 */}
            {damageDealtToBoss !== null && damageTakenByUser == 0 &&(
              <p className="mt-2 text-green-700">⚔️ ボスに **{damageDealtToBoss}** ダメージ与えました！</p>
            )}
            {damageTakenByUser !== null && damageDealtToBoss == 0 &&(
              <p className="mt-2 text-red-700">💥 ユーザーは **{damageTakenByUser}** ダメージ受けました！</p>
            )}
          </div>
        )}

        {/* 次の問題へボタン */}
        {selectedAnswer && ( // 回答済みの場合のみ表示
          <button
            onClick={handleNextProblemOrEndQuest}
            disabled={isProcessingAnswer} // 処理中なら無効化
            className="mt-8 px-8 py-4 bg-pink-600 text-white font-bold text-xl rounded-full shadow-lg hover:bg-pink-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-300"
          >
            {questFinishedStatus ? '結果を見る ✅' : '次の問題へ ➡️'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestPage;