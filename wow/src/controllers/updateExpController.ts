import { Request, Response } from 'express';
import { updateExperienceAndLevel } from '../lib/quizService'; // ロジック関数をインポート

/**
 * POST /api/exp-status: 経験値を加算し、レベルアップ判定を行うコントローラー
 */
export const updateExpController = async (req: Request, res: Response) => {
    // このAPIはbodyからuserIdを受け取る設計なので、認証チェックは簡略化 (セキュリティのため認証ミドルウェアは適用すべき)
    const { userId: rawUserId, correctDifficulties } = req.body;

    const userId = parseInt(rawUserId, 10);

    // 入力データのバリデーション
    if (!userId || !Array.isArray(correctDifficulties) || correctDifficulties.some((d: any) => typeof d !== 'number')) {
        return res.status(400).json({ error: 'Invalid input' });
    }
    
    try {
        const result = await updateExperienceAndLevel(userId, correctDifficulties);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Failed to add experience:", error);
        return res.status(500).json({ error: 'Internal Server Error', details: (error as Error).message });
    }
};