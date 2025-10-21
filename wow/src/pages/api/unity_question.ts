import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@/generated/prisma";
// JWT検証のためにjsonwebtokenをインポート
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// BigIntをJSONでシリアライズするためのヘルパー関数 (変更なし)
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

// シャッフルする関数 (変更なし)
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// ５問のクイズデータを生成するAPIハンドラー
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        let userIdInt: number;

        try {
            // ★ JWT認証チェックとユーザーIDの取得 ★
            const authHeader = req.headers.authorization;
            
            // 1. ヘッダー形式のチェック
            if (!authHeader?.startsWith("Bearer ")) {
                console.warn("クイズAPI: 認証ヘッダー 'Bearer' が見つかりません。");
                return res.status(401).json({ error: "認証が必要です: Bearerトークンを使用してください。" });
            }

            // 2. トークンの分離と検証
            const token = authHeader.split(" ")[1];
            // JWT_SECRETは環境変数に設定されている必要があります
            const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number }; 
            
            // 3. ユーザーIDの取得
            userIdInt = payload.id;
            // ★ 認証チェックここまで ★

            const QUIZ_COUNT = 5; // 取得するクイズの数
            
            // ユーザーの単語
            const userWords = await prisma.word.findMany({
                where: {
                    userId: userIdInt, // JWTから取得したIDを使用
                },
            });
            
            // 運営が追加した単語
            const adminWords = await prisma.word.findMany({
                where: {
                    userId: null, // ユーザーIDがnullの単語は運営が追加したもの
                },
            });

            const allWords = [...userWords, ...adminWords]; // ユーザーの単語と運営の単語を結合
            
            // 単語数のチェック
            if (allWords.length < QUIZ_COUNT + 3) {
                console.warn("クイズ生成エラー: 5問のクイズを作るための単語が不足してます。");
                return res.status(500).json({ error: `クイズを生成するには単語が${QUIZ_COUNT + 3}つ以上必要です。` });
            }

            // ... (クイズ生成ロジックは変更なし) ...
            const quizzes = [];
            const usedCorrectWordIds = new Set<number>();
            const availableWords = shuffleArray(allWords);

            for (let i = 0; i < QUIZ_COUNT; i++) {
                let correctWord = null;
                for (const word of availableWords) {
                    // IDの型チェックと使用済みチェック
                    if (typeof word.id === 'number' || typeof word.id === 'bigint') {
                        if (!usedCorrectWordIds.has(Number(word.id))) {
                            correctWord = word;
                            usedCorrectWordIds.add(Number(word.id));
                            break;
                        }
                    }
                }

                if (!correctWord) {
                    console.warn("クイズ生成エラー: 正解の単語が見つかりません。");
                    return res.status(400).json({ error: `クイズを生成するには単語が${QUIZ_COUNT}問のクイズを生成できませんでした。` });
                }
                
                const question = correctWord.meaning;
                const correctAnswer = correctWord.word;
                const difficultyLevel = correctWord.difficultyLevel;
                
                // 正解以外の単語リストを作成 (BigInt/numberに対応するため、IDの比較に注意)
                const otherWords = allWords.filter(word => {
                    const currentWordId = String(word.id);
                    const correctId = String(correctWord!.id);
                    return currentWordId !== correctId;
                });
                
                if (otherWords.length < 3) {
                    console.warn("クイズ生成エラー: 不正解の単語が3つ未満です。");
                    return res.status(500).json({ error: "クイズを生成するには不正解の単語が3つ以上必要です。" });
                }
                
                const incorrectAnswers: string[] = [];
                const usedWordsOption = new Set<string>();
                usedWordsOption.add(correctAnswer);

                const shuffledOtherWords = shuffleArray(otherWords);
                for (let j = 0; j < shuffledOtherWords.length && incorrectAnswers.length < 3; j++) {
                    const word = shuffledOtherWords[j].word;
                    if (!usedWordsOption.has(word)) {
                        incorrectAnswers.push(word);
                        usedWordsOption.add(word);
                    }
                }
                
                if (incorrectAnswers.length < 3) {
                    console.warn("クイズ生成エラー: 不正解の単語が3つ未満です。");
                    return res.status(500).json({ error: "クイズを生成するには不正解の単語が3つ以上必要です。" });
                }
                
                const options = shuffleArray([correctAnswer, ...incorrectAnswers]);
                
                quizzes.push(serializeBigInt({
                    wordId: correctWord.id,
                    question: question,
                    options: options,
                    correctAnswer: correctAnswer,
                    difficultyLevel: difficultyLevel,
                }));
            }
            
            return res.status(200).json(quizzes); 

        } catch (error: any) {
            console.error("Error generating quiz:", error);
            
            // JWT検証エラーの場合、401を返す
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                 console.warn(`JWT検証失敗: ${error.message}`);
                 return res.status(401).json({ error: "無効または期限切れの認証トークンです。" });
            }

            return res.status(500).json({ error: "クイズの生成に失敗しました。", details: error.message });
        }
    } else {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Method Not Allowed" });
    }
}