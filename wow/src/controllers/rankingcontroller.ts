// rankingController.ts (または ranking.controller.ts)

import { PrismaClient, Prisma } from "@prisma/client"; 
import { Request, Response } from 'express';
// 💡 修正ポイント: 共通のPrismaインスタンスをインポート (必要に応じてパスを修正)
import prisma from '../lib/prisma'; 
// 認証が必要な場合はこちらをインポート
// import { authenticateToken } from './../middleware/authMiddleware'; 


/**
 * ユーザーランキングを取得するAPIハンドラ。
 * レベル降順で上位10人のユーザー名、レベル、キャラクター画像URLを返します。
 * HTTP GETメソッドのみを受け入れます。
 *
 * @param req Express Requestオブジェクト
 * @param res Express Responseオブジェクト
 */
export const getRankingHandler = async (req: Request, res: Response) => {
    
    // HTTP GETメソッドのみを許可
    if (req.method !== "GET") {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // --- ランキングデータの取得 ---
        // レベルの降順で、ユーザー情報とキャラクター画像URLを含めて取得
        const ranking = await prisma.userCharacter.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                    },
                },
                levelStatus: {
                    select: {
                        characterImage: true,
                    }
                },
            },
            orderBy: {
                level: 'desc',
            },
            take: 10, // 上位10人を取得
        });

        // --- データフォーマットの整形 ---
        const formattedRanking = ranking.map(item => ({
            // Prismaのクエリ結果の型を想定してマッピング
            userId: item.userId,
            username: item.user.username,
            level: item.level,
            // levelStatusがnullの場合に備えてフォールバックを設定
            characterImage: item.levelStatus?.characterImage || '', 
        }));
        
        // 成功レスポンス
        return res.status(200).json(formattedRanking);

    } catch (error) {
        console.error('Error fetching ranking:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: (error as Error).message });
    }
};