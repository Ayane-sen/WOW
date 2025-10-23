// wordController.ts (または新しいファイル)

import { Request, Response } from 'express';
// ★修正: JWT検証はミドルウェア（authMiddleware.ts）に任せます。jwtのインポートは不要です。★
import { PrismaClient } from "@/generated/prisma"; 

const prisma = new PrismaClient();

// ExpressのRequestオブジェクトにuserIdプロパティが設定されていることを前提とします。
// authMiddleware.ts で以下のような定義が必要です:
// declare global { namespace Express { interface Request { userId?: number; } } }


/**
 * 認証済みユーザーの登録単語リスト取得処理 (GET /api/words)
 * ユーザーIDは認証ミドルウェアから取得し、該当ユーザーの単語リストを返します。
 */
export const getUserWords = async (req: Request, res: Response) => {
    
    // 認証ミドルウェアによって設定されたユーザーIDを取得
    const userIdInt = req.userId; 

    // 認証チェック (ミドルウェアで弾かれますが、念のため内部エラーチェック)
    if (!userIdInt) {
        // 通常、authenticateTokenミドルウェアで401が返されるため、
        // ここに到達した場合はサーバーのミドルウェア設定エラーの可能性が高いです。
        return res.status(401).json({ error: "認証が必要です。" });
    }

    try {
        // DBから該当ユーザーIDの単語をすべて取得
        const words = await prisma.word.findMany({ 
            where: { userId: userIdInt } 
        });

        // 成功レスポンス
        // ExpressはPrismaのBigIntをJSONに変換する処理を自動でサポートしない可能性があるため、
        // 必要に応じてBigIntシリアライズヘルパー関数を適用してください
        return res.status(200).json(words); 

    } catch (err: any) {
        console.error("Error fetching user words:", err);
        return res.status(500).json({ 
            error: "単語取得に失敗しました", 
            details: err.message 
        });
    }
};