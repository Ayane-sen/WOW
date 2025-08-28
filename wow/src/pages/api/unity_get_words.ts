import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) 
      return res.status(401).json({ error: "認証されていません" });

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const userId = payload.id;

    const words = await prisma.word.findMany({ where: { userId } });
    return res.status(200).json(words);

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "単語取得に失敗しました", details: err.message });
  }
}
