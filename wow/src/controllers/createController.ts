// wordController.ts

import { Request, Response } from 'express';
// ★修正: JWT検証はミドルウェア（authMiddleware.ts）に任せます。jwtのインポートは不要です。★
import { PrismaClient, Prisma } from "@/generated/prisma"; 

const prisma = new PrismaClient();

// ExpressのRequestオブジェクトにuserIdプロパティが設定されていることを前提とします。
// authMiddleware.ts で以下のような定義が必要です:
// declare global { namespace Express { interface Request { userId?: number; } } }


/**
 * 単語登録処理 (POST /api/word)
 * ユーザーIDは認証ミドルウェアから取得し、新しい単語をDBに作成します。
 */
export const addWord = async (req: Request, res: Response) => {
    
    // 認証ミドルウェアによって設定されたユーザーIDを取得
    const userIdInt = req.userId; 

    // 認証チェック (ミドルウェアで弾かれますが、念のため内部エラーチェック)
    if (!userIdInt) {
        return res.status(401).json({ error: "認証が必要です。" });
    }

    // JSONボディのチェック（express.json()が適用済みを前提）
    if (!req.body) {
        return res.status(400).json({ error: 'リクエストボディがありません。' });
    }

    const { word, meaning, difficultyLevel } = req.body;

    // バリデーションチェック
    if (!word || !meaning) {
        return res.status(400).json({ error: "単語と意味は必須です。" });
    }
    
    try {
        // **P2002キャッチ** 既存単語は登録できない
        try {
            const newWord = await prisma.word.create({
                data: {
                    word,
                    meaning,
                    difficultyLevel: difficultyLevel || 3, // デフォルト値の適用
                    userId: userIdInt, // 認証済みユーザーIDを使用
                },
            });

            // 成功レスポンス
            return res.status(201).json(newWord);
        } catch (error: any) {
            // Prismaのユニーク制約違反（P2002）の場合
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                return res.status(409).json({ error: "この単語は既に登録されています" });
            }
            // その他のエラーはそのままスローして外側のcatchで処理
            throw error; 
        }
    } catch (err: any) {
        console.error("Error creating word:", err);
        return res.status(500).json({
            error: "単語の作成に失敗しました", 
            details: err.message
        });
    }
};