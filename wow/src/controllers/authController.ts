// authController.ts (Prisma Clientを使用するバージョン)

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
// ★修正: Prisma Clientのインポート★
import { PrismaClient } from '@/generated/prisma'; 

const prisma = new PrismaClient(); // Prisma Clientのインスタンス化

/**
 * ログイン処理 (POST /api/login)
 * ユーザーの認証を行い、成功すればJWTトークンを返します。
 */
export const unityLogin = async (req: Request, res: Response) => {
    
    // JWT_SECRETは server.ts の dotenv.config() で読み込みが完了していると仮定
    const JWT_SECRET = process.env.JWT_SECRET;

    // 致命的エラーチェック (JWT_SECRETが設定されているか)
    if (!JWT_SECRET || JWT_SECRET.trim() === "") {
        console.error("FATAL ERROR: JWT_SECRETが設定されていません。");
        return res.status(500).json({ error: "サーバー設定エラー: 秘密鍵が見つかりません。" });
    }

    // リクエストボディのチェック（express.json()が適用済みを前提）
    if (!req.body) {
        return res.status(400).json({ error: 'リクエストボディがありません。' });
    }

    const { email, password } = req.body;

    // 1. バリデーションチェック
    if (!email || !password) {
        return res.status(400).json({ error: "メールアドレスとパスワードは必須です。" });
    }
    
    try {
        // 2. ユーザーをデータベースから検索 (Prismaを使用)
        // 🚨 注意: userCharacterを含めるかはスキーマ設計と用途によりますが、以前のコードに倣います
        const user = await prisma.user.findUnique({ 
            where: { email },
            include: {userCharacter: true} 
        });

        if (!user) {
            // ユーザーが見つからない
            console.warn(`[AUTH] ログイン失敗: ユーザーが見つかりません for ${email}`);
            return res.status(401).json({ error: "メールアドレスまたはパスワードが違います。" });
        }

        // 3. パスワードの検証 (user.passwordHash と req.body.password を比較)
        const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordCorrect) {
            // パスワードが一致しない
            console.warn(`[AUTH] ログイン失敗: パスワード不一致 for ${email}`);
            return res.status(401).json({ error: "メールアドレスまたはパスワードが違います。" });
        }

        // 4. 認証成功 -> JWTトークンの生成
        const token = jwt.sign(
            // payload: user.id (PrismaのIDは型に注意)
            { userId: Number(user.id) }, 
            JWT_SECRET, 
            { expiresIn: '1h' } // トークンの有効期限
        );
        
        // 5. 成功レスポンスの返却
        return res.status(200).json({
            token: token,
            username: user.username,
            // userCharacterがない場合を考慮
            level: user.userCharacter?.level || 1 ,
            userId: user.id.toString()
        });

    } catch (error) {
        console.error("ログイン処理中のDB/JWTエラー:", error);
        return res.status(500).json({ error: "サーバーエラーが発生しました。" });
    }
};

// 補足: このファイルではユーザーIDの取得関数は不要になったため削除します。