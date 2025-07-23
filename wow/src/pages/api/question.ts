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
    if(req.method=="GET"){
        try{
            //サンプルユーザーの情報を取得
            const sampleUser=await prisma.user.findFirst();
            if(!sampleUser){
                console.error("Sample user not found");
                return res.status(404).json({ error: "サンプルユーザーが見つかりません。" });
            }
            const userId=sampleUser.id;
            //ユーザーの単語
            const userWords=await prisma.word.findMany({
                where: {
                    userId: userId,
                },
            });
            //運営が追加した単語
            const adminWords=await prisma.word.findMany({
                where: {
                    userId: null, // ユーザーIDがnullの単語は運営が追加したもの
                },
            });

            const allWords= [userWords, adminWords].flat();
            if(allWords.length<4){
                console.warn("クイズ生成エラー: 単語が4つ未満です。");
                return res.status(400).json({ error: "クイズを生成するには単語が4つ以上必要です。" });
            }
            //正解の単語をランダムに選択
            const correctWordIndex=Math.floor(Math.random()*allWords.length);
            const correctWord=allWords[correctWordIndex];

            const question=correctWord.meaning;
            const correctAnswer=correctWord.word;
            //不正解の選択肢の生成
            const otherWords=allWords.filter(word=>word.id!==correctWord.id);
            if(otherWords.length<3){
                console.warn("クイズ生成エラー: 不正解の単語が3つ未満です。");
                return res.status(400).json({ error: "クイズを生成するには不正解の単語が3つ以上必要です。" });
            }
            const shuffledOtherWords=otherWords.sort(() => Math.random() - 0.5);
            const incorrectAnswers=shuffledOtherWords.slice(0, 3).map(word => word.word);
            //正解と不正解をランダムに並べ替える
            const options = [correctAnswer, ...incorrectAnswers].sort(() => Math.random() - 0.5);
            //クイズのデータを返す
            return res.status(200).json(serializeBigInt({
                question: question,
                options: options,
                correctAnswer: correctAnswer,
            }));
        } catch (error) {
            console.error("Error generating quiz:", error);
            return res.status(500).json({ error: "クイズの生成に失敗しました。" });
        }
    }else{
        res.setHeader("Allow", "GET");
        // メソッドがGET以外の場合は405エラーを返す
        return res.status(405).json({ error: "Method Not Allowed" });
    }
}