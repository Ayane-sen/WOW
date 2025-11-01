// questRoutes.ts (または quest.controller.ts)

import { PrismaClient, Prisma } from "@prisma/client"; // Prisma型の参照には @prisma/client を使用
import { Request, Response } from 'express';
// 認証ミドルウェアはプロジェクト構造に応じてパスを修正してください
// import { authenticateToken } from './../middleware/authMiddleware'; 
// 💡 修正点: 共通のPrismaインスタンスをインポート
import prisma from '../lib/prisma';

// =================================================================
// ユーティリティ関数
// =================================================================

/**
 * BigInt型の値をJSONでシリアライズするためのヘルパー関数。
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
 * ランダムな問題とその選択肢を生成するヘルパー関数。
 * @param tx PrismaClient または Prisma.TransactionClient
 */
async function getRandomProblem(tx: PrismaClient | Prisma.TransactionClient) {
    // Wordモデルの型定義 (Prisma Clientが提供する型を使用できない場合のフォールバック)
    type WordItem = { id: number; word: string; meaning: string; difficultyLevel?: number; userId?: number | null };

    const allWords = await tx.word.findMany({
        where: {
            OR: [
                { userId: { not: null } },
                { userId: null }
            ]
        },
    }) as WordItem[];

    if (allWords.length === 0) {
        return null;
    }
    if (allWords.length < 4) {
        console.warn("Not enough words (less than 4) to generate a question with 3 incorrect options.");
        return null; 
    }

    const firstProblemWord = shuffleArray(allWords)[0];
    
    const otherWordsPool = allWords.filter(w => w.id !== firstProblemWord.id);
    const incorrectOptions: string[] = [];
    const usedOptions = new Set<string>();
    usedOptions.add(firstProblemWord.word);

    const shuffledOtherWords = shuffleArray(otherWordsPool);
    // 3つのユニークな不正解の選択肢を取得
    for (let i = 0; i < shuffledOtherWords.length && incorrectOptions.length < 3; i++) {
        const wordOption = shuffledOtherWords[i].word;
        if (!usedOptions.has(wordOption)) {
            incorrectOptions.push(wordOption);
            usedOptions.add(wordOption);
        }
    }
    
    if (incorrectOptions.length < 3) {
        console.warn("Not enough unique words for 3 incorrect options.");
        return null;
    }

    const options = shuffleArray([firstProblemWord.word, ...incorrectOptions]);

    return {
        wordId: firstProblemWord.id,
        question: firstProblemWord.meaning,
        options: options,
        correctAnswer: firstProblemWord.word,
        difficultyLevel: firstProblemWord.difficultyLevel || 1,
    };
}


// =================================================================
// クエスト開始API (GET /quest/start)
// =================================================================

export const startQuestHandler = async (req: Request, res: Response) => {
  const userId = req.userId; // ミドルウェアから取得したユーザーID
  
  if (!userId) {
      return res.status(401).json({ error: "認証情報が見つかりません。" });
  }

  try {
    // --- 1. ユーザーのキャラクター情報を取得 ---
    let userCharacter = await prisma.userCharacter.findUnique({
      where: { userId },
    });

    if (!userCharacter) {
      console.warn(`ユーザーキャラクターが見つかりません (userId: ${userId})。デフォルトで作成します。`);
      userCharacter = await prisma.userCharacter.create({
        data: {
          userId: userId,
          level: 1,
          experience: 0,
        },
      });
    }

    const levelStatus = await prisma.levelStatus.findUnique({
      where: { level: userCharacter.level }
    });

    const currentUserStatus = {
      userId: userCharacter.userId,
      // 💡 HPがnullの場合のフォールバック値を設定
      currentHp: levelStatus?.hp || 100,
      maxHp: levelStatus?.hp || 100,
      currentLevel: userCharacter.level,
      attackPower: levelStatus?.attackPower || 10,
      defensePower: levelStatus?.defensePower || 5,
      characterImage: levelStatus?.characterImage || null,
    };

    // --- 2. 対象となるボスを取得 (MVP: 最初のボス) ---
    const boss = await prisma.boss.findFirst();
    if (!boss) {
      console.error("クエスト開始API: データベースにボスが登録されていません。");
      return res.status(500).json({ error: "クエストを開始できません。ボスデータがありません。" });
    }

    // 既存の進行中クエストセッションを探す
    let questSession = await prisma.questSession.findFirst({
      where: {
        userId: userId,
        bossId: boss.id,
        questStatus: "ongoing",
      },
      orderBy: { startedAt: 'desc' }
    });

    // 既存のセッションがあればそれを使用、なければ新しく作成
    if (questSession) {
      console.log(`既存の進行中クエストセッションを再利用します。ID: ${questSession.id}`);
    } else {
      console.log("新しいクエストセッションを作成します。");
      questSession = await prisma.questSession.create({
        data: {
          userId: userId,
          bossId: boss.id,
          userCurrentHp: currentUserStatus.currentHp,
          bossCurrentHp: boss.initialHp,
          questStatus: "ongoing",
        },
      });
    }

    // --- 4. 最初の問題を選択 ---
    // 💡 トランザクション外でも、共通の prisma インスタンスを使用
    const currentProblem = await getRandomProblem(prisma);
    if (!currentProblem) {
        console.warn("クエスト開始API: 出題できる単語がデータベースにありません。");
        return res.status(400).json({ error: "クイズを生成できません。出題できる単語がありません。" });
    }

    // --- 5. レスポンスを返す ---
    return res.status(200).json(serializeBigInt({
      questSessionId: questSession.id,
      boss: {
        id: boss.id,
        name: boss.name,
        initialHp: boss.initialHp,
        currentHp: questSession.bossCurrentHp,
        attack: boss.attack,
        defense: boss.defense,
        imageUrl: boss.imageUrl,
      },
      userStatus: {
        ...currentUserStatus,
        currentHp: questSession.userCurrentHp
      },
      currentProblem: currentProblem,
    }));

  } catch (error: any) {
    console.error("Failed to start quest:", error);
    // 💡 エラーメッセージに詳細を含めてクライアントに返す
    return res.status(500).json({ error: 'クエストの開始に失敗しました。', details: error.message });
  }
};


// =================================================================
// クイズ解答API (POST /quest/answer)
// =================================================================

export const answerQuestHandler = async (req: Request, res: Response) => {
  const userId = req.userId; // ミドルウェアから取得したユーザーID
  if (!userId) {
      return res.status(401).json({ error: "認証情報が見つかりません。" });
  }
  
  // bodyから必要なデータを取得
  const { questSessionId, wordId, userAnswer, isCorrect } = req.body; 

  // 入力値のバリデーション
  if (questSessionId === undefined || typeof questSessionId !== 'number' ||
      wordId === undefined || typeof wordId !== 'number' ||
      userAnswer === undefined || typeof userAnswer !== 'string' ||
      isCorrect === undefined || typeof isCorrect !== 'boolean') {
    console.error("Invalid input received:", req.body);
    return res.status(400).json({ error: "Invalid input: Missing or invalid questSessionId, wordId, userAnswer, or isCorrect." });
  }

  try {
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
        const difficultyLevel = (answeredWord as any)?.difficultyLevel || 1; 
        const DIFFICULTY_BONUS_FACTOR = 5;

        damageDealtToBoss = Math.max(1, userAttack - bossDefense) + (difficultyLevel * DIFFICULTY_BONUS_FACTOR);
        newBossHp = Math.max(0, questSession.bossCurrentHp - damageDealtToBoss);
        console.log(`正解！ボスに ${damageDealtToBoss} ダメージ与えました。ボスのHP: ${newBossHp}`);
      } else {
        const RANDOM_FACTOR = 0.2;
        const baseDamage = Math.max(10, bossAttack - userDefense) * 2;
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
      
      // ガチャポイントの付与 (QuestSessionの更新と同時にトランザクション内で実行)
      if (questStatus === "completed") {
        console.log("クエストが成功したため、ガチャポイントを付与します。");
        await tx.user.update({
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
        // トランザクション内で getRandomProblem を呼び出す
        nextProblem = await getRandomProblem(tx);
        if (!nextProblem) {
          console.warn("次の問題がありません。");
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
};


// =================================================================
// クエスト結果取得API (GET /quest/result?questSessionId=...)
// =================================================================

export const getQuestResultHandler = async (req: Request, res: Response) => {
  const userId = req.userId; // ミドルウェアから取得したユーザーID
  
  if (!userId) {
      return res.status(401).json({ error: "認証情報が見つかりません。" });
  }
  
  // クエリパラメータからquestSessionIdを取得
  const { questSessionId } = req.query; 
  
  if (!questSessionId || typeof questSessionId !== 'string') {
    return res.status(400).json({ error: "Invalid Quest Session ID." });
  }
  
  const parsedQuestSessionId = parseInt(questSessionId, 10);

  if (isNaN(parsedQuestSessionId)) {
    return res.status(400).json({ error: "Invalid Quest Session ID." });
  }

  try {
    // クエストセッションとその関連データを取得
    const questSession = await prisma.questSession.findUnique({
      where: { id: parsedQuestSessionId },
      include: {
        boss: true, // ボス情報を含める
        user: {
          include: {
            userCharacter: {
              include: {
                levelStatus: true // ユーザーキャラクターのレベルステータス情報を含める
              }
            }
          }
        }
      }
    });

    if (!questSession || questSession.userId !== userId) {
      // クエストセッションが見つからない、または現在のユーザーのものでない場合
      return res.status(404).json({ error: "Quest session not found or not owned by user." });
    }

    const userCharacter = questSession.user.userCharacter;
    if (!userCharacter || !userCharacter.levelStatus) {
        console.error("User character or level status not found for quest session:", questSession.id);
        return res.status(500).json({ error: "ユーザーキャラクター情報が不完全です。" });
    }
    
    // ユーザーの最終キャラクター状態を構築
    const finalUserCharacterStatus = {
        userId: userCharacter.userId,
        currentLevel: userCharacter.level,
        currentExperience: userCharacter.experience,
        characterImage: userCharacter.levelStatus.characterImage || null,
        attackPower: userCharacter.levelStatus.attackPower || null,
        defensePower: userCharacter.levelStatus.defensePower || null,
        skillUnlocked: userCharacter.levelStatus.skillUnlocked || null,
        hp: userCharacter.levelStatus.hp || null,
    };

    // レスポンスペイロードを構築
    return res.status(200).json(serializeBigInt({
      questSessionId: questSession.id,
      questStatus: questSession.questStatus, // "completed" or "failed"
      finalBossHp: questSession.bossCurrentHp,
      finalUserHp: questSession.userCurrentHp,
      bossName: questSession.boss.name,
      finalUserCharacterStatus: finalUserCharacterStatus, // ユーザーの最終ステータス
    }));

  } catch (error: any) {
    console.error("Failed to get quest result:", error);
    return res.status(500).json({ error: 'クエスト結果の取得に失敗しました。', details: error.message });
  }
};