import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

function weightedRandom<T extends{rarity: number}>(items: T[]):T|undefined{
    const weights:{[key:number]:number}={
        1:100,
        2:50,
        3:10,
    };
    const totalWeight = items.reduce((sum, item) => sum + (weights[item.rarity] || 0), 0);
    let randomNum = Math.random() * totalWeight;
    for(const item of items){
        randomNum -= weights[item.rarity] || 0;
        if(randomNum <= 0){
            return item;
        }
    }
    return undefined;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){
    // サーバーサイドでセッション情報を取得
    const session = await getServerSession(req, res, authOptions);

    // セッションがない（ログインしていない）場合はエラー
    if (!session || !session.user?.id) {
        return res.status(401).json({ error: '認証されていません' });
    }

    if (req.method === 'POST') {
        const GACHA_COST = 100;
        try {
            const userId = session.user.id;
            const user = await prisma.user.findUnique({
                where: { id: Number(userId) },
                select: { gachapoint: true }
            });
            // ユーザーが見つからない場合はエラーを返す
            if (!user) {
                return res.status(404).json({ error: 'ユーザーが見つかりません' });
            }
            // ポイントが足りない場合はエラーを返す
            if (user.gachapoint < GACHA_COST) {
                return res.status(402).json({ error: 'ポイントが足りません' });
            }

            const gachaItems=await prisma.gacha_items.findMany();
            if (!gachaItems || gachaItems.length === 0) {
                return res.status(404).json({ error: 'ガチャアイテムが見つかりません' });
            }
            const drawnItem= weightedRandom(gachaItems);
            if (!drawnItem) {
                return res.status(404).json({ error: 'ガチャ抽選に失敗しました' });
            }


            const existingItem = await prisma.user_items.findFirst({
                where: {
                    userId: Number(userId),
                    gachaItemId: drawnItem.id,
                },
            });
            const transactionActions=[];
            // ポイントを減算する操作
            transactionActions.push(
                prisma.user.update({
                where: { id: Number(userId) },
                data: { gachapoint: { decrement: GACHA_COST } },
                })
            );
            if (existingItem) {
                // アイテムが既に存在する場合は数量を増やす
                transactionActions.push(
                    prisma.user_items.update({
                        where: { id: existingItem.id },
                        data: { quantity: existingItem.quantity + 1 },
                    })
                );
            } else {
                // アイテムが存在しない場合は新規作成
                transactionActions.push(
                    prisma.user_items.create({
                        data: {
                            userId: Number(userId),
                            gachaItemId: drawnItem.id,
                            quantity: 1,
                        },
                    })
                );
            }
            // gacha_historyに履歴を追加
            transactionActions.push(
                prisma.gacha_history.create({
                data: {
                    userId: Number(userId),
                    gachaItemId: drawnItem.id,
                },
                })
            );

            // トランザクションを実行
            const results = await prisma.$transaction(transactionActions);
            const updatedUser = results[0] as { gachapoint: number };
            const updatedUserItem = results[1];
            const gachaHistory = results[2];

            // 成功レスポンスを返す
            res.status(200).json({
                message: 'ガチャ成功',
                item: drawnItem,
                userItemRecord: updatedUserItem,
                gachaHistoryRecord: gachaHistory,
                updatedUserPoints: updatedUser.gachapoint,
            });
        }catch(error){
            console.error(error);
            res.status(500).json({ error: 'ガチャの実行中にエラーが発生しました' });
        }
    }else{
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}