import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "DELETE") return res.status(405).end();

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ error: "認証されていません" });

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const userId = payload.id;

    const wordId = Number(req.query.id);
    if (!wordId) return res.status(400).json({ error: "IDが無効です" });

    await prisma.word.deleteMany({
      where: { id: wordId, userId }
    });

    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "削除失敗", details: err.message });
  }
}
