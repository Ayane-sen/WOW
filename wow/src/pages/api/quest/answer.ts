import { PrismaClient, Prisma } from "@/generated/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';


const prisma = new PrismaClient();

/**
 * BigInt型の値をJSONでシリアライズするためのヘルパー関数。
 * @param obj シリアライズするオブジェクト、配列、またはプリミティブ値
 * @returns BigIntが文字列に変換されたオブジェクト
 */
function serializeBigInt(obj: any): any {
  if (typeof obj === "bigint") {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  } else if (obj && typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result;
  } else {
    return obj;
  }
}

/**
 * 配列をランダムにシャッフルするヘルパー関数 (Fisher-Yatesアルゴリズム)。
 * @param array シャッフルする配列
 * @returns シャッフルされた新しい配列
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * クイズの解答を受け取り、ダメージ計算を行い、クエストの状態を更新するAPIハンドラー。
 * HTTP POSTメソッドのみを受け入れます。
 *
 * @param req NextApiRequestオブジェクト（リクエスト情報）
 * @param res NextApiResponseオブジェクト（レスポンス情報）
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // **修正点: 受信したメソッドと期待するメソッドを詳細にログ出力**
  console.log(`DEBUG: /api/quest/answer - Received method: '${req.method}', Expected method: 'POST'`);
  console.log(`DEBUG: Method comparison result: ${req.method !== "POST"}`); // 比較結果もログ出力

  if (req.method !== "POST") {
    console.warn(`DEBUG: Method Not Allowed - Request method was '${req.method}'.`);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const session = await getServerSession( req, res, authOptions );
    if (!session || !session.user?.id) {
      console.warn("クエスト開始API: 認証されていないユーザー、またはユーザーIDが見つかりません。");
      return res.status(401).json({ error: "認証が必要です。ログインしてください。" });
    }
    const userId = parseInt(session.user.id as string, 10);
    if (isNaN(userId)) {
      console.error("クエスト解答API: ログインユーザーのIDが無効な形式です。", session.user.id);
      return res.status(500).json({ error: "ログインユーザーのIDが無効な形式です。" });
    }

    const { questSessionId, wordId, userAnswer, isCorrect, userCurrentHp } = req.body;

    // 入力値のバリデーション
    if (questSessionId === undefined || typeof questSessionId !== 'number' ||
        wordId === undefined || typeof wordId !== 'number' ||
        userAnswer === undefined || typeof userAnswer !== 'string' ||
        isCorrect === undefined || typeof isCorrect !== 'boolean' ||
        userCurrentHp === undefined || typeof userCurrentHp !== 'number') {
      console.error("Invalid input received:", { questSessionId, wordId, userAnswer, isCorrect, userCurrentHp });
      return res.status(400).json({ error: "Invalid input: Missing or invalid questSessionId, wordId, userAnswer, isCorrect, or userCurrentHp." });
    }

    // トランザクションでデータベース操作を原子的に実行
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // --- 1. QuestSession の状態を取得 ---
      const questSession = await tx.questSession.findUnique({
        where: { id: questSessionId },
        include: { boss: true, user: { include: { userCharacter: { include: { levelStatus: true } } } } }
      });

      if (!questSession || questSession.userId !== userId || questSession.questStatus !== "ongoing") {
        console.warn(`Invalid or inactive quest session. ID: ${questSessionId}, User: ${userId}, Status: ${questSession?.questStatus}`);
        throw new Error("Invalid or inactive quest session.");
      }

      const { boss } = questSession;

      // --- 2. ユーザーとボスの現在のステータスを取得 ---
      const userCharacter = await tx.userCharacter.findUnique({
        where: { userId: userId }
      });
      if (!userCharacter) {
        throw new Error("User character not found.");
      }

      const levelStatus = await tx.levelStatus.findUnique({
        where: { level: userCharacter.level }
      });
      if (!levelStatus) {
        throw new Error(`Level status for level ${userCharacter.level} not found.`);
      }

      const userAttack = levelStatus.attackPower || 10;
      const userDefense = levelStatus.defensePower || 5;
      const bossAttack = boss.attack;
      const bossDefense = boss.defense;

      let damageDealtToBoss = 0;
      let damageTakenByUser = 0;

      let newBossHp = questSession.bossCurrentHp;
      let newUserHp = questSession.userCurrentHp;

      // --- 3. ダメージ計算 ---
      if (isCorrect) {
        const answeredWord = await tx.word.findUnique({ where: { id: wordId } });
        const difficultyLevel = answeredWord?.difficultyLevel || 1;
        const DIFFICULTY_BONUS_FACTOR = 5;

        damageDealtToBoss = Math.max(1, userAttack - bossDefense) + (difficultyLevel * DIFFICULTY_BONUS_FACTOR);
        newBossHp = Math.max(0, questSession.bossCurrentHp - damageDealtToBoss);
        console.log(`正解！ボスに ${damageDealtToBoss} ダメージ与えました。ボスのHP: ${newBossHp}`);
      } else {
        const RANDOM_FACTOR = 0.2;
        const baseDamage = Math.max(10, bossAttack - userDefense)*2;
        const randomMultiplier = 1 + (Math.random() * 2 - 1) * RANDOM_FACTOR;
        damageTakenByUser = Math.floor(baseDamage * randomMultiplier);
        newUserHp = Math.max(0, questSession.userCurrentHp - damageTakenByUser);
        console.log(`不正解！ユーザーが ${damageTakenByUser} ダメージ受けました。ユーザーのHP: ${newUserHp}`);
      }

      // --- 4. QuizHistory に解答履歴を記録 ---
      await tx.quizHistory.create({
        data: {
          userId: userId,
          wordId: wordId,
          isCorrect: isCorrect,
          answeredAt: new Date(),
        },
      });
      console.log("解答履歴を記録しました。");

      // --- 5. QuestSession の状態を更新 ---
      let questStatus = "ongoing";
      if (newBossHp <= 0) {
        questStatus = "completed";
      } else if (newUserHp <= 0) {
        questStatus = "failed";
      }
      //ガチャポイントの付与
    if (questStatus === "completed") {
      console.log("クエストが成功したため、ガチャポイントを付与します。");
      // クエストが成功した場合、ガチャポイントを付与
      await prisma.user.update({
        where: { id: userId },
        data: { gachapoint: { increment: 50 } }
      });
    }

      const updatedQuestSession = await tx.questSession.update({
        where: { id: questSessionId },
        data: {
          userCurrentHp: newUserHp,
          bossCurrentHp: newBossHp,
          questStatus: questStatus,
        },
      });
      console.log(`QuestSessionを更新しました。クエストステータス: ${questStatus}`);

      // --- 6. 次の問題を選択 (クエストが継続する場合のみ) ---
      let nextProblem = null;
      if (questStatus === "ongoing") {
        const allWords = await tx.word.findMany({
          where: {
            OR: [
              { userId: { not: null } },
              { userId: null }
            ]
          },
        });

        if (allWords.length === 0) {
          console.warn("次の問題がありません。");
        } else {
          const nextProblemWord = shuffleArray(allWords)[0];
          nextProblem = {
            wordId: nextProblemWord.id,
            question: nextProblemWord.meaning,
            options: shuffleArray([
              nextProblemWord.word,
              ...(shuffleArray(allWords.filter(w => w.id !== nextProblemWord.id)).slice(0, 3).map(w => w.word))
            ]),
            correctAnswer: nextProblemWord.word,
            difficultyLevel: nextProblemWord.difficultyLevel || 1,
          };
        }
      }

      // --- 7. レスポンスデータを返す ---
      return {
        questSession: updatedQuestSession,
        damageDealtToBoss,
        damageTakenByUser,
        newBossHp,
        newUserHp,
        questStatus,
        nextProblem,
      };
    });

    return res.status(200).json(serializeBigInt(result));

  } catch (error: any) {
    console.error("Failed to answer quest problem:", error);
    if (error.message === "Invalid or inactive quest session.") {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'クエストの解答処理に失敗しました。', details: error.message });
  }
}