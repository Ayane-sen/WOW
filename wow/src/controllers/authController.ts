// src/controllers/authController.ts

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // パスワードのハッシュ化・検証用
// 🚨 実際には、データベースとやり取りする関数をインポートします 🚨
// 例として、ここでは仮のDB関数を用意します
// import { findUserByEmail, createUser } from '../models/userModel';

// ExpressのRequestオブジェクトにuserIdプロパティを追加（authMiddleware.tsで定義済みと仮定）
// declare global { namespace Express { interface Request { userId?: number; } } }


// 🚨 簡略化のための仮のDB実装 (実際はDBアクセスが必要です) 🚨
let DUMMY_DB: { id: number, email: string, username: string, level: number, passwordHash: string }[] = [];
let nextUserId = 1;

// ユーザーをメールアドレスで検索する関数 (仮)
const findUserByEmail = (email: string) => DUMMY_DB.find(u => u.email === email);


/**
 * ログイン処理 (POST /api/login)
 * ユーザーの認証を行い、成功すればJWTトークンを返します。
 */
export const unityLogin = async (req: Request, res: Response) => {
    
    // JWT_SECRETは server.ts の dotenv.config() で読み込みが完了していると仮定
    const JWT_SECRET = process.env.JWT_SECRET;

    // 致命的エラーチェック (念のため)
    if (!JWT_SECRET || JWT_SECRET.trim() === "") {
        console.error("FATAL ERROR: JWT_SECRETが設定されていません。");
        return res.status(500).json({ error: "サーバー設定エラー: 秘密鍵が見つかりません。" });
    }

    const { email, password } = req.body;

    // 1. バリデーションチェック (簡易)
    if (!email || !password) {
        return res.status(400).json({ error: "メールアドレスとパスワードは必須です。" });
    }
    
    // 2. ユーザーをデータベースから検索
    let user = findUserByEmail(email);

    // 3. 🚨 ユーザーが存在しない場合、テスト用に自動登録する (実際のアプリでは不要) 🚨
    if (!user) {
        try {
            // パスワードをハッシュ化
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            // ユーザー登録（本来はDBに保存）
            user = {
                id: nextUserId++,
                email: email,
                username: email.split('@')[0],
                level: 1,
                passwordHash: passwordHash // ハッシュ値を保存
            };
            DUMMY_DB.push(user);
            console.log(`[AUTH] 新規ユーザーを登録しました: ${user.username}`);
            // 登録後、そのままログイン処理へ進みます。

        } catch (error) {
            console.error("ユーザー登録エラー:", error);
            return res.status(500).json({ error: "ログイン処理中にエラーが発生しました。" });
        }
    }


    // 4. パスワードの検証
    // req.body.password (平文) と user.passwordHash (ハッシュ) を比較
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        // パスワードが一致しない
        console.warn(`[AUTH] ログイン失敗: パスワード不一致 for ${email}`);
        return res.status(401).json({ error: "メールアドレスまたはパスワードが違います。" });
    }

    // 5. 認証成功 -> JWTトークンの生成
    try {
        const token = jwt.sign(
            // payload: ユーザーIDのみを含めるのが一般的
            { id: user.id }, 
            JWT_SECRET, 
            { expiresIn: '1h' } // トークンの有効期限
        );
        
        // 6. 成功レスポンスの返却
        return res.status(200).json({
            token: token,
            username: user.username,
            level: user.level
        });

    } catch (error) {
        console.error("JWT署名エラー:", error);
        return res.status(500).json({ error: "ログイン処理中にエラーが発生しました。" });
    }
};

// 🚨 補足：クイズコントローラーなどで必要になるかもしれないエクスポート 🚨
export const getUserIdFromEmail = (email: string) => findUserByEmail(email)?.id;