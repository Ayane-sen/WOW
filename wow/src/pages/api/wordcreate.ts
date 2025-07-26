import { PrismaClient } from "@/generated/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();
// BigIntをJSONでシリアライズするためのヘルパー関数
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
    if(req.method === "POST") {
        // リクエストボディから 'word' と 'meaning' を取得
        const{ word, meaning, difficultLevel } = req.body;

        if(!word || !meaning) {
            return res.status(400).json({ error: "単語と意味は必須です。" });
        }
        if(difficultLevel < 1 || difficultLevel > 5) {
            return res.status(400).json({ error: "難易度は1から5の範囲で指定してください。" });
        }
        try{
          // サンプルユーザーの情報を取得
          const sampleUser=await prisma.user.findFirst();
          if(!sampleUser){
            console.error("Sample user not found");
            return res.status(404).json({ error: "サンプルユーザーが見つかりません。" });
          }
          const newWord=await prisma.word.create({
              data:{
                  word: word,
                  meaning: meaning,
                  difficultyLevel: difficultLevel, // 難易度を保存
                  userId: sampleUser.id, // サンプルユーザーのIDを使用
              },
          });
          console.log("word added:", newWord);

          return res.status(201).json(serializeBigInt(newWord)); // 成功した場合は201ステータスコードと新しい単語を返す

        }catch(error) {
            console.error("Error adding word:", error);
            // エラーが発生した場合は500エラーを返す
            return res.status(500).json({ error: "単語の追加に失敗しました。" });
        }
    }else{
        res.setHeader("Allow", "POST");
        // メソッドがPOST以外の場合は405エラーを返す
        return res.status(405).json({ error: "Method Not Allowed" });
    }
}