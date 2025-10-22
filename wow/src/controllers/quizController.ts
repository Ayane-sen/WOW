// quizController.ts
import { Request, Response } from 'express';
import { PrismaClient } from "@/generated/prisma";
// jwtは認証ミドルウェアで処理済みのため不要

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
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * ５問のクイズデータを生成するAPIハンドラー
 */
export const getQuizData = async (req: Request, res: Response) => {
    // ミドルウェアでGETリクエストと認証済みであることを前提とします
    const userIdInt = req.userId;

    // ミドルウェアが正常なら認証済み。もしuserIdがない場合は内部エラー。
    if (!userIdInt) {
        return res.status(500).json({ error: "内部エラー: 認証済みのユーザーIDが見つかりません。" });
    }

    try {
        const QUIZ_COUNT = 5;

        // ユーザーの単語
        const userWords = await prisma.word.findMany({
            where: { userId: userIdInt }, 
        });
        
        // 運営が追加した単語
        const adminWords = await prisma.word.findMany({
            where: { userId: null },
        });

        const allWords = [...userWords, ...adminWords];
        
        // 単語数のチェック
        if (allWords.length < QUIZ_COUNT + 3) {
            console.warn("クイズ生成エラー: 5問のクイズを作るための単語が不足してます。");
            return res.status(500).json({ error: `クイズを生成するには単語が${QUIZ_COUNT + 3}つ以上必要です。` });
        }

        const quizzes = [];
        const usedCorrectWordIds = new Set<number>();
        const availableWords = shuffleArray(allWords);

        for (let i = 0; i < QUIZ_COUNT; i++) {
            let correctWord = null;
            for (const word of availableWords) {
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
        
        // 最終的なレスポンス
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(quizzes); 

    } catch (error: any) {
        console.error("Error generating quiz:", error);
        return res.status(500).json({ error: "クイズの生成に失敗しました。", details: error.message });
    }
};