import { PrismaClient } from "@/generated/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

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


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const session = await getSession({ req });
    if (!session || !session.user?.id) {
      console.warn("クエスト結果API: 認証されていないユーザーからのリクエスト。");
      return res.status(401).json({ error: "認証が必要です。ログインしてください。" });
    }

    const userId = parseInt(session.user.id as string, 10);
    if (isNaN(userId)) {
      console.error("クエスト結果API: ログインユーザーのIDが無効な形式です。", session.user.id);
      return res.status(500).json({ error: "ログインユーザーのIDが無効な形式です。" });
    }

    const { questSessionId } = req.query; // クエリパラメータからquestSessionIdを取得
    const parsedQuestSessionId = parseInt(questSessionId as string, 10);

    if (isNaN(parsedQuestSessionId)) {
      return res.status(400).json({ error: "Invalid Quest Session ID." });
    }

    // クエストセッションとその関連データを取得
    const questSession = await prisma.questSession.findUnique({
      where: { id: parsedQuestSessionId },
      include: {
        boss: true, // ボス情報を含める
        user: {
          include: {
            userCharacter: {
              include: {
                levelStatus: true // ユーザーキャラクターのレベルステータス情報を含める
              }
            }
          }
        }
      }
    });

    if (!questSession || questSession.userId !== userId) {
      // クエストセッションが見つからない、または現在のユーザーのものでない場合
      return res.status(404).json({ error: "Quest session not found or not owned by user." });
    }

    const userCharacter = questSession.user.userCharacter;
    if (!userCharacter || !userCharacter.levelStatus) {
        // userCharacterまたはlevelStatusが見つからない場合はエラー
        console.error("User character or level status not found for quest session:", questSession.id);
        throw new Error("User character or level status not found after quest.");
    }

    // ユーザーの最終キャラクター状態を構築
    const finalUserCharacterStatus = {
        userId: userCharacter.userId,
        currentLevel: userCharacter.level,
        currentExperience: userCharacter.experience,
        characterImage: userCharacter.levelStatus.characterImage || null,
        attackPower: userCharacter.levelStatus.attackPower || null,
        defensePower: userCharacter.levelStatus.defensePower || null,
        skillUnlocked: userCharacter.levelStatus.skillUnlocked || null,
        hp: userCharacter.levelStatus.hp || null,
    };

    // レスポンスペイロードを構築
    return res.status(200).json(serializeBigInt({
      questSessionId: questSession.id,
      questStatus: questSession.questStatus, // "completed" or "failed"
      finalBossHp: questSession.bossCurrentHp,
      finalUserHp: questSession.userCurrentHp,
      bossName: questSession.boss.name,
      finalUserCharacterStatus: finalUserCharacterStatus, // ユーザーの最終ステータス
      // 必要であれば、ここでクエスト固有の報酬情報などを追加できます
    }));

  } catch (error: any) {
    console.error("Failed to get quest result:", error);
    return res.status(500).json({ error: 'クエスト結果の取得に失敗しました。', details: error.message });
  }
}
