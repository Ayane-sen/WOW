import { PrismaClient } from "@/generated/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

const prisma = new PrismaClient();

// クイズの解答を受け付け、履歴を記録するAPIハンドラー
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は受け付けない
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // ユーザー認証
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.id) {
      return res.status(401).json({ error: "認証が必要です。ログインしてください。" });
    }

    const userId = parseInt(session.user.id, 10);
    // リクエストボディから解答データを取得
    const { wordId, isCorrect }: { wordId: number; isCorrect: boolean } = req.body;

    // データが不足している場合はエラーを返す
    if (isNaN(userId) || !wordId || typeof isCorrect === 'undefined') {
      return res.status(400).json({ error: "リクエストデータが無効です。" });
    }

    // QuizHistoryテーブルに解答履歴を記録
    await prisma.quizHistory.create({
      data: {
        userId: userId,
        wordId: wordId,
        isCorrect: isCorrect,
        answeredAt: new Date(),
      },
    });

    // 成功したレスポンスを返す
    return res.status(200).json({ message: "解答履歴を記録しました。" });

  } catch (error) {
    console.error("解答履歴の記録エラー:", error);
    return res.status(500).json({ error: "解答履歴の記録に失敗しました。", details: (error as Error).message });
  }
}