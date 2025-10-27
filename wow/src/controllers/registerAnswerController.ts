import { Request, Response } from 'express';
import { registerQuizAnswerHistory } from '../lib/quizService'; // ロジック関数をインポート

interface AuthenticatedRequest extends Request {
    userId?: number; 
}

/**
 * POST /api/quiz-register: クイズの解答履歴を記録するコントローラー
 */
export const registerAnswerController = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        return res.status(401).json({ error: "認証が必要です。ログインしてください。" });
    }

    const userId = typeof req.userId === 'string' ? parseInt(req.userId, 10) : Number(req.userId);
    const { wordId, isCorrect }: { wordId: number; isCorrect: boolean } = req.body;

    // 入力データのバリデーション
    if (isNaN(userId) || !wordId || typeof isCorrect === 'undefined') {
        return res.status(400).json({ error: "リクエストデータが無効です。" });
    }
    
    try {
        await registerQuizAnswerHistory(userId, wordId, isCorrect);
        return res.status(200).json({ message: "解答履歴を記録しました。" });
    } catch (error) {
        console.error("解答履歴の記録エラー:", error);
        return res.status(500).json({ error: "解答履歴の記録に失敗しました。", details: (error as Error).message });
    }
};