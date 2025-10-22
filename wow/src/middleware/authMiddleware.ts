// authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ExpressのRequestオブジェクトにuserIdプロパティを追加
declare global {
    namespace Express {
        interface Request {
            userId?: number;
        }
    }
}

/**
 * Bearerトークンを検証し、成功した場合にreq.userIdを設定するミドルウェア
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "認証が必要です: Bearerトークンを使用してください。" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // JWT_SECRETはExpress環境のprocess.envに設定されている必要
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
        
        // 検証成功: userIdをリクエストオブジェクトに格納
        req.userId = payload.id;
        next();
    } catch (error: any) {
        console.warn(`JWT検証失敗: ${error.message}`);
        // トークン検証エラー（期限切れなど）の場合も401を返す
        return res.status(401).json({ error: "無効または期限切れの認証トークンです。" });
    }
};