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

//シャッフルする関数
function shuffleArray<T>(array: T[]):T[]{
    const newArray=[...array];
    for(let i=newArray.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [newArray[i], newArray[j]]=[newArray[j], newArray[i]];
    }
    return newArray;
}
//５問のクイズデータを生成するAPIハンドラー
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method=="GET"){
        try{
            const QUIZ_COUNT=5;// 取得するクイズの数
            //ユーザーの情報を取得
            const session = await getServerSession(req, res, authOptions);
            if(!session || !session.user?.id){
                console.warn("クエスト開始API: 認証されていないユーザー、またはユーザーIDが見つかりません。");
                return res.status(401).json({ error: "認証が必要です。ログインしてください。" });
            }
            //ユーザーの単語
            const userWords=await prisma.word.findMany({
                where: {
                    userId: parseInt(session.user.id, 10), // ユーザーIDを数値に変換
                },
            });
            //運営が追加した単語
            const adminWords=await prisma.word.findMany({
                where: {
                    userId: null, // ユーザーIDがnullの単語は運営が追加したもの
                },
            });

            const allWords= [userWords, adminWords].flat();// ユーザーの単語と運営の単語を結合
            if(allWords.length<QUIZ_COUNT+3){
                console.warn("クイズ生成エラー: 5問のクイズを作るための単語が不足してます。");
                return res.status(500).json({ error: "クイズを生成するには単語が${QUIZ_COUNT+3}つ以上必要です。" });
            }

            //正解の単語をランダムに選択
            const quizzes=[];
            const usedCorrectWordIds=new Set<number>();//同じクイズセット内で正解の単語が重複しないように管理
            const availableWords=shuffleArray(allWords);

            //指定された数のクイズを生成
            for(let i=0;i<QUIZ_COUNT;i++){
                let correctWord=null;
                for(const word of availableWords){
                    if(!usedCorrectWordIds.has(word.id)){// まだ使用されていない単語を見つける
                        correctWord=word;
                        usedCorrectWordIds.add(word.id);
                        break;
                    }
                }
                if(!correctWord){
                    console.warn("クイズ生成エラー: 正解の単語が見つかりません。");
                    return res.status(400).json({ error: "クイズを生成するには単語が${QUIZ_COUNT}問のクイズを生成できませんでした。" });
                }
                usedCorrectWordIds.add(correctWord.id);// 正解の単語を使用済みに追加
                const question=correctWord.meaning// クイズの質問は単語の意味
                const correctAnswer=correctWord.word;// 正解の単語
                const difficultyLevel=correctWord.difficultyLevel;// 難易度レベル
                
                const otherWords=allWords.filter(word=>word.id!==correctWord.id);
                if(otherWords.length<3){
                    console.warn("クイズ生成エラー: 不正解の単語が3つ未満です。");
                    return res.status(500).json({ error: "クイズを生成するには不正解の単語が3つ以上必要です。" });
                }
                const incorrectAnswers: string[]=[];
                const usedWordsOption=new Set<string>();
                usedWordsOption.add(correctAnswer);// 正解の単語を使用済みに追加
                //不正解の単語をランダムに3つ選択
                const shuffledOtherWords=shuffleArray(otherWords);
                for(let j=0;j<shuffledOtherWords.length && incorrectAnswers.length<3;j++){
                    const word=shuffledOtherWords[j].word;
                    if(!usedWordsOption.has(word)){// まだ使用されていない単語を選択
                        incorrectAnswers.push(word);
                        usedWordsOption.add(word);// 使用済みに追加
                    }
                }
                if(incorrectAnswers.length<3){
                    console.warn("クイズ生成エラー: 不正解の単語が3つ未満です。");
                    return res.status(500).json({ error: "クイズを生成するには不正解の単語が3つ以上必要です。" });
                }
                //正解と不正解の単語を結合してシャッフル
                const options=shuffleArray([correctAnswer, ...incorrectAnswers]);
                // クイズデータを保存
                quizzes.push(serializeBigInt({
                    question: question,
                    options: options,
                    correctAnswer: correctAnswer,
                    difficultyLevel: difficultyLevel,
                }));
            }
                return res.status(200).json(quizzes);// すべてのクイズを返す

            
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