import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) 
      return res.status(401).json({ error: "認証されていません" });

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const userId = payload.id;

    const { word, meaning, difficultyLevel } = req.body;
    if (!word || !meaning) return res.status(400).json({ error: "単語と意味は必須です" });

    const newWord = await prisma.word.create({
      data: { word, meaning, difficultyLevel: difficultyLevel || 3, userId }
    });

    return res.status(201).json(newWord);

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "単語の作成に失敗しました", details: err.message });
  }
}
