import { Request, Response } from 'express';
import { generateQuizzes } from '../lib/quizService'; // ロジック関数をインポート

// Expressの認証ミドルウェアによってreq.userIdが設定されていることを前提とする
interface AuthenticatedRequest extends Request {
    userId?: number; 
}

/**
 * GET /api/question: 5問のクイズデータを生成して返すコントローラー
 */
export const getQuizController = async (req: AuthenticatedRequest, res: Response) => {
    // 認証ミドルウェアによってuserIdが設定されているかチェック
    if (!req.userId) {
        return res.status(401).json({ error: "認証が必要です。ログインしてください。" });
    }
    
    try {
        const quizzes = await generateQuizzes(String(req.userId));
        return res.status(200).json(quizzes);
    } catch (error) {
        console.error("Error generating quiz:", error);
        // ロジック関数内でthrowされたエラーメッセージをそのまま返す
        return res.status(500).json({ error: (error as Error).message || "クイズの生成に失敗しました。" });
    }
};