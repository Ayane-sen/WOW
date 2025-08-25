import {PrismaClient} from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma=new PrismaClient();

//正答率で難易度を決定する関数
const getNewLevel= (accuracyRate: number): number => {
    if (accuracyRate >= 80) {
        return 1; // 易しい
    } else if (accuracyRate >= 60) {
        return 2; // 普通
    } else if (accuracyRate >= 40) {
        return 3; // 難しい
    } else if (accuracyRate >= 20) {
        return 4; // 非常に難しい
    }else{
        return 5; // 極めて難しい
    }
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){
    // POSTリクエストのみを許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '許可されていないメソッドです' });
  }
  try{
    const session=await getServerSession(req,res,authOptions);
    if (!session || !session.user?.id) {
      throw new Error('認証されていません');
    }
    const userId = Number(session.user.id);
    const { wordIds } = req.body as { wordIds: number[] };

    if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
      return res.status(400).json({ error: '無効な単語IDデータです' });
    }

    const updatePromises = wordIds.map(wordId => 
      prisma.$transaction(async (tx) => {
        // 1. その単語の正答率を再計算
        const totalAnswers = await tx.quizHistory.count({
          where: { userId, wordId },
        });
        const correctAnswers = await tx.quizHistory.count({
          where: { userId, wordId, isCorrect: true },
        });
        const accuracyRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
        
        // 2. 難易度を更新
        const newLevel = getNewLevel(accuracyRate);
        const updatedWord = await tx.word.update({
          where: { id: wordId },
          data: { difficultyLevel: newLevel },
        });
        return updatedWord;
      })
    );
    const updatedWords = await Promise.all(updatePromises);
    return res.status(200).json({ message: '難易度が更新されました', updatedWords });
  }catch(error){
    console.error('Error updating difficulty:', error);
    return res.status(500).json({ error: '難易度の更新に失敗しました' });
  }finally{
    await prisma.$disconnect(); // Prismaの接続を切断
  }
}