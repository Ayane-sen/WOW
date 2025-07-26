import { PrismaClient } from "@/generated/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

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

// シャッフルする関数
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// ５問のクイズデータを生成するAPIハンドラ
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // セッション情報を取得して、ログイン状態を確認する
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
        return res.status(401).json({ error: "認証されていません" });
    }

    const userId = parseInt(session.user.id, 10);
    if (req.method === "GET") {
        try {
            const QUIZ_COUNT = 5; // 取得するクイズの数

            const userWords = await prisma.word.findMany({ where: { userId: userId } }); // ユーザーの単語
            const adminWords = await prisma.word.findMany({ where: { userId: null } }); // ユーザーIDがnullの単語は運営が追加したもの
            const allWords = [userWords, adminWords].flat(); // ユーザーの単語と運営の単語を結合

            // 単語が1つもなければクイズは作れず、処理を終了
            if (allWords.length === 0) {
                return res.status(200).json([]); // 空の配列を返して、フロント側で「単語がありません」と表示させる
            }

            // 正解の単語をランダムに選択
            const quizzes = [];
            const usedCorrectWordIds = new Set<number>(); // 同じクイズセット内で正解の単語が重複しないように管理
            const availableWords = shuffleArray(allWords);

            // 指定された数のクイズを生成
            for (let i = 0; i < QUIZ_COUNT; i++) {
                let correctWord = null;
                for (const word of availableWords) {
                    if (!usedCorrectWordIds.has(word.id)) { // まだ使用されていない単語を見つける
                        correctWord = word;
                        usedCorrectWordIds.add(word.id);
                        break;
                    }
                }

                if (!correctWord) {
                    console.warn("クイズ生成エラー: 正解の単語が見つかりません。");
                    return res.status(400).json({ error: "クイズを生成するには単語が${QUIZ_COUNT}問のクイズを生成できませんでした。" });
                }
                usedCorrectWordIds.add(correctWord.id); // 正解の単語を使用済みに追加

                const { meaning: question, word: correctAnswer, difficultyLevel } = correctWord;
                
                const otherWords = allWords.filter(word => word.id !== correctWord.id);
                const shuffledOtherWords = shuffleArray(otherWords); 
                const incorrectAnswers = shuffledOtherWords.slice(0, 3).map(w => w.word); // 不正解の単語をランダムに3つ選択
                
                
                const usedWordsOption = new Set<string>();
                usedWordsOption.add(correctAnswer); // 正解の単語を使用済みに追加
                
                // 正解と不正解の単語を結合してシャッフル
                const options = shuffleArray([correctAnswer, ...incorrectAnswers]);
      
                // クイズデータを保存
                quizzes.push(serializeBigInt({
                    question,
                    options,
                    correctAnswer,
                    difficultyLevel,
                }));
            }
            
            return res.status(200).json(quizzes); // すべてのクイズを返す
        
        } catch (error) {
        console.error("Error generating quiz:", error);
        return res.status(500).json({ error: "クイズの生成に失敗しました。" });
        }
    } else {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: "Method Not Allowed" });
    }
}