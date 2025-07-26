// ゲームステータス取得API
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@/generated/prisma'; 

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Pages Routerでは、メソッドの判定が必要
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // URLから[userId]の部分を取得
  const { userId: userIdQuery } = req.query;
  const userId = parseInt(Array.isArray(userIdQuery) ? userIdQuery[0] : userIdQuery || '', 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid User ID' });
  }

  try {
    const userCharacter = await prisma.userCharacter.findUnique({
      where: { userId },
    });

    if (!userCharacter) {
      return res.status(404).json({ error: 'User not found' });
    }

    const levelStatus = await prisma.levelStatus.findUnique({
      where: {
        level: userCharacter.level,
      }
    });

    const responsePayload = {
      userId: userCharacter.userId,
      currentLevel: userCharacter.level,
      currentExperience: userCharacter.experience,
      lastUpdated: userCharacter.lastUpdated,
      status: levelStatus,
    };
    
    // Pages Routerでは res.status().json() でレスポンスを返す
    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error("Failed to get user status:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}