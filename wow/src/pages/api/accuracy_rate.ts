import {PrismaClient} from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import type { NextApiRequest, NextApiResponse } from 'next';


const prisma=new PrismaClient();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){
    try{
        const session = await getServerSession(req,res,authOptions);
        if (!session || !session.user?.id) {
            throw new Error('認証されていません');
        }
        const userId = parseInt(session.user.id, 10); // セッションからIDを取得
            // Prismaのaggregation機能を使って集計
        const results=await prisma.quizHistory.groupBy({
            by:['wordId'],
            where:{
                userId: userId,
            },
            _count:{
                _all:true,
            }, 
        });
        // 正解数を数える
        const correctResults = await prisma.quizHistory.groupBy({
            by: ['wordId'],
            where: {
                userId: userId,
                isCorrect: true,
            },
            _count:{
                _all:true,
            },
        });
        // 全てのwordIdを取得
        const allWordIds = results.map(r => r.wordId);

        // 関連する単語名をすべて一度に取得
        const words = await prisma.word.findMany({
        where: { id: { in: allWordIds } },
        select: { id: true, word: true },
    });

        // 各単語の正答率を計算
        const accuracyRates=results.map(result=>{
            const wordId = result.wordId;
            const totalCount = result._count._all;
            const correctCount = correctResults.find(r => r.wordId === wordId)?._count._all || 0;
            const accuracyRate = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
            const wordname=words.find(w=>w.id===wordId);
            return {
                word: wordname?.word || '不明',
                wordId: wordId,
                accuracyRate: Math.floor(accuracyRate), // 小数点以下を切り捨て
            };
        });
        return res.status(200).json(accuracyRates);


    }catch(error){
        console.error('Error fetching word accuracy rates:', error);
        return res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }finally{
        await prisma.$disconnect();
    }
}