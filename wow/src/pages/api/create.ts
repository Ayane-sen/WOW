import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // サーバーサイドでセッション情報を取得
  const session = await getServerSession(req, res, authOptions);

  // セッションがない（ログインしていない）場合はエラー
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: '認証されていません' });
  }

  if (req.method === 'POST') {
    try {
      const { word, meaning, difficultyLevel } = req.body;
      const userId = parseInt(session.user.id, 10); // セッションからIDを取得

      const newWord = await prisma.word.create({
        data: {
          word,
          meaning,
          difficultyLevel,
          userId: userId, // ログインユーザーのIDを紐付ける
        },
      });
      res.status(201).json(newWord);
    } catch (error) {
      res.status(500).json({ error: '単語の作成に失敗しました' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}