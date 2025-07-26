import { PrismaClient, Prisma } from "@/generated/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

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

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const session = await getServerSession( req, res, authOptions );
    if (!session || !session.user?.id) {
      console.warn("クエスト開始API: 認証されていないユーザー、またはユーザーIDが見つかりません。");
      return res.status(401).json({ error: "認証が必要です。ログインしてください。" });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      console.error("クエスト開始API: ログインユーザーのIDが無効な形式です。", session.user.id);
      return res.status(500).json({ error: "ログインユーザーのIDが無効な形式です。" });
    }

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
      currentHp: levelStatus?.hp || 100,
      maxHp: levelStatus?.hp || 100, // maxHpを追加
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

    // **修正点: 既存の進行中クエストセッションを探す**
    let questSession = await prisma.questSession.findFirst({
      where: {
        userId: userId,
        bossId: boss.id,
        questStatus: "ongoing",
      },
      orderBy: { startedAt: 'desc' } // 最新のセッションを取得
    });

    // **修正点: 既存のセッションがあればそれを使用、なければ新しく作成**
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
    // 既存セッションを再利用する場合、currentProblemIndexに基づいて問題を選ぶことも可能だが、
    // MVPではシンプルに毎回ランダムな問題を出題する。
    const currentProblem = await getRandomProblem(prisma);
    if (!currentProblem) {
        console.warn("クエスト開始API: 出題できる単語がデータベースにありません。");
        return res.status(400).json({ error: "クイズを生成できません。出題できる単語がありません。" });
    }

    // --- 5. レスポンスを返す ---
    return res.status(200).json(serializeBigInt({
      questSessionId: questSession.id, // 既存または新規のセッションID
      boss: {
        id: boss.id,
        name: boss.name,
        initialHp: boss.initialHp,
        currentHp: questSession.bossCurrentHp, // 既存セッションのHPを反映
        attack: boss.attack,
        defense: boss.defense,
        imageUrl: boss.imageUrl,
      },
      userStatus: {
        ...currentUserStatus,
        currentHp: questSession.userCurrentHp // 既存セッションのHPを反映
      },
      currentProblem: currentProblem,
    }));

  } catch (error: any) {
    console.error("Failed to start quest:", error);
    return res.status(500).json({ error: 'クエストの開始に失敗しました。', details: error.message });
  }
}

async function getRandomProblem(tx: PrismaClient | Prisma.TransactionClient) {
    const allWords = await tx.word.findMany({
        where: {
            OR: [
                { userId: { not: null } },
                { userId: null }
            ]
        },
    });

    if (allWords.length === 0) {
        return null;
    }

    const firstProblemWord = shuffleArray(allWords)[0];
    
    const otherWordsPool = allWords.filter(w => w.id !== firstProblemWord.id);
    const incorrectOptions: string[] = [];
    const usedOptions = new Set<string>();
    usedOptions.add(firstProblemWord.word);

    const shuffledOtherWords = shuffleArray(otherWordsPool);
    for (let i = 0; i < shuffledOtherWords.length && incorrectOptions.length < 3; i++) {
        const wordOption = shuffledOtherWords[i].word;
        if (!usedOptions.has(wordOption)) {
            incorrectOptions.push(wordOption);
            usedOptions.add(wordOption);
        }
    }

    if (incorrectOptions.length < 3 && allWords.length >= 4) {
        console.warn("Not enough unique words for 3 incorrect options. Filling with duplicates if necessary or returning fewer options.");
    } else if (allWords.length < 4) {
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