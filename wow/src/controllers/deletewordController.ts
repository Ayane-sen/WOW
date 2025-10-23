// wordController.ts (または新しいファイル)

import { Request, Response } from 'express';
// ★修正: JWT検証はミドルウェア（authMiddleware.ts）に任せます。jwtのインポートは不要です。★
import { PrismaClient } from "@/generated/prisma"; 

const prisma = new PrismaClient();

/**
 * 認証済みユーザーの単語削除処理 (DELETE /api/delete_word/:id)
 * ユーザーIDと単語IDが一致した場合にのみ単語を削除します。
 */
export const deleteWord = async (req: Request, res: Response) => {
    
    // 認証ミドルウェアによって設定されたユーザーIDを取得
    const userIdInt = req.userId; 

    // 認証チェック (ミドルウェアで弾かれますが、念のため)
    if (!userIdInt) {
        return res.status(401).json({ error: "認証が必要です。" });
    }

    // 1. パスパラメータから単語IDを取得
    const wordId = Number(req.params.id); 
    
    // 2. IDのバリデーション
    if (isNaN(wordId) || wordId <= 0) {
        return res.status(400).json({ error: "IDが無効です" });
    }

    try {
        // 3. 単語を削除
        // ユーザーIDと単語IDが一致するレコードのみを削除（セキュリティのため重要）
        const result = await prisma.word.deleteMany({
            where: { id: wordId, userId: userIdInt }
        });

        // 4. 成功レスポンス
        if (result.count === 0) {
             // 削除対象の単語が見つからない、または認証済みユーザーの単語ではない場合
             return res.status(404).json({ error: "指定された単語が見つからないか、削除する権限がありません。" });
        }

        return res.status(200).json({ success: true, message: `単語ID ${wordId} を削除しました。` });

    } catch (err: any) {
        console.error("Error deleting word:", err);
        return res.status(500).json({ 
            error: "削除失敗", 
            details: err.message 
        });
    }
};