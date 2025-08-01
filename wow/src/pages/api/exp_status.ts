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
  const { userId, correctDifficulties } = req.body;

  if (!userId || !Array.isArray(correctDifficulties)) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  // correctDifficulties配列内の各要素が数値であることを確認
  if (correctDifficulties.some((d: any) => typeof d !== 'number')) {
    return res.status(400).json({ error: 'Invalid input: All elements in correctDifficulties must be numbers.' });
  }

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let totalExperienceGained = 0;// 経験値の合計を初期化
      // 重複する難易度レベルがあるかもしれないので、Setでユニーク化
      const uniqueDifficulties = [...new Set(correctDifficulties)];
      if (uniqueDifficulties.length > 0) {
        // 英単語の難易度に応じた経験値を取得
        const expSetting = await tx.experience.findMany({
          where: { difficultyLevel: { in: uniqueDifficulties } },
        });
        //経験値の合計
        for(const difficulty of correctDifficulties){
          const setting = expSetting.find(s => s.difficultyLevel === difficulty);
          if (setting) {
            totalExperienceGained += setting.getexperience;
          }else{
            throw new Error(`Experience setting for difficulty level ${difficulty} not found.`);
          }
        }

      }else{
        console.log("No correct answers provided, total experience gained is 0.");
      }
          
      // 現在のユーザー進捗を取得
      let userCharacter = await tx.userCharacter.findUnique({
        where: { userId },
      });

      if (!userCharacter) {
        userCharacter = await tx.userCharacter.create({ data: { userId } });
      }

      // 経験値加算
      const newExperience = userCharacter.experience + totalExperienceGained;

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

      return { ...updatedProgress, leveledUp, newCharacterImage, totalExperienceGained };
    });

    // res オブジェクトを使ってレスポンスを返す
    return res.status(200).json(result);

  } catch (error) {
    console.error("Failed to add experience:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}