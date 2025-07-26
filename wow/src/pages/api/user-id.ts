import { PrismaClient } from "@/generated/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

/**
 * BigInt型の値をJSONでシリアライズするためのヘルパー関数。
 * @param obj シリアライズするオブジェクト、配列、またはプリミティブ値
 * @returns BigIntが文字列に変換されたオブジェクト
 */
function serializeBigInt(obj: any): any {
  if (typeof obj === "bigint") {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  } else if (obj && typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result;
  } else {
    return obj;
  }
}

/**
 * ユーザーIDを取得するAPIハンドラー。
 * @param req Next.jsのリクエストオブジェクト
 * @param res Next.jsのレスポンスオブジェクト
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const sampleUser = await prisma.user.findFirst();
      if (!sampleUser) {
        console.error("Sample user not found for ID API.");
        return res.status(404).json({ error: "サンプルユーザーが見つかりません。データベースにユーザーが存在することを確認してください。" });
      }
      // ここで userId だけを返す
      return res.status(200).json(serializeBigInt({ userId: sampleUser.id }));
    } catch (error: any) {
      console.error("Error fetching sample user ID:", error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    console.warn(`許可されていないメソッドが使用されました: ${req.method}`);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}