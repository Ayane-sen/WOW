// 経験値加算 & レベルアップAPI
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@/generated/prisma';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // メソッドをチェック
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // リクエストボディを取得 (req.body を使用)
  const { userId, difficultyLevel } = req.body;

  if (!userId || typeof difficultyLevel !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 英単語の難易度に応じた経験値を取得
      const expSetting = await tx.experience.findUnique({
        where: { difficultyLevel: difficultyLevel },
      });

      // 設定が見つからない場合はエラー
      if (!expSetting) {
        throw new Error(`Experience setting for difficulty level ${difficultyLevel} not found.`);
      }

      const experienceGained = expSetting.getexperience;

      // 現在のユーザー進捗を取得
      let userCharacter = await tx.userCharacter.findUnique({
        where: { userId },
      });

      if (!userCharacter) {
        userCharacter = await tx.userCharacter.create({ data: { userId } });
      }

      // 経験値加算
      const newExperience = userCharacter.experience + experienceGained;

      // レベルアップ判定
      const potentialNextLevels = await tx.levelStatus.findMany({
        where: {
          level: {
            gt: userCharacter.level,
          },
          requiredExperience: {
            lte: newExperience,
          },
        },
        orderBy: {
          level: 'desc',
        },
      });

      let newLevel = userCharacter.level;
      let leveledUp = false;
      let newCharacterImage: string | null = null;

      if (potentialNextLevels.length > 0) {
        newLevel = potentialNextLevels[0].level;
        leveledUp = true;
        newCharacterImage = potentialNextLevels[0].characterImage;
      }
      
      const updatedProgress = await tx.userCharacter.update({
        where: { userId },
        data: {
          experience: newExperience,
          level: newLevel,
        },
      });

      return { ...updatedProgress, leveledUp, newCharacterImage };
    });

    // res オブジェクトを使ってレスポンスを返す
    return res.status(200).json(result);

  } catch (error) {
    console.error("Failed to add experience:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}