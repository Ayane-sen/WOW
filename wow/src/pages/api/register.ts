// ユーザー登録API
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエスト以外は受け付けない
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { username, email, password } = req.body;

    // 入力値のバリデーション（簡易的）
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'すべてのフィールドを入力してください。' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'パスワードは8文字以上で設定してください。' });
    }

    // メールアドレスが既に存在するかチェック
    const existingUserByEmail = await prisma.user.findUnique({
    where: {
        email: email,
    },
    });

    if (existingUserByEmail) {
    return res.status(409).json({ error: 'このメールアドレスは既に使用されています。' });
    }

    // ユーザー名が既に存在するかチェック
    const existingUserByUsername = await prisma.user.findUnique({
    where: {
        username: username,
    },
    });

    if (existingUserByUsername) {
    return res.status(409).json({ error: 'このユーザー名は既に使用されています。' });
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 新しいユーザーをデータベースに作成
    const user = await prisma.user.create({
      data: {
        username: username,
        email: email,
        passwordHash: hashedPassword, // ハッシュ化したパスワードを保存
      },
    });
    
    // ユーザー作成と同時にキャラクター情報も作成する場合
    await prisma.userCharacter.create({
      data: {
        userId: user.id
      }
    });

    // 成功レスポンスを返す (パスワード情報は返さない)
    res.status(201).json({
      message: 'ユーザー登録が完了しました。',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
}