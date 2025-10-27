import { PrismaClient, Prisma } from '@/generated/prisma'; // 適切なパスに修正してください

const prisma = new PrismaClient();

// =================================================================
// ヘルパー関数
// =================================================================

// BigIntをJSONでシリアライズするためのヘルパー関数
function serializeBigInt(obj: any): any {
  if (typeof obj === "bigint") {
    // BigIntを文字列に変換
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

// 配列をシャッフルする関数
export function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}


// =================================================================
// 1. クイズデータ生成ロジック (question.ts)
// =================================================================

interface Word {
    id: number;
    word: string;
    meaning: string;
    difficultyLevel: number;
    userId: number | null;
}

interface QuizResult {
  wordId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficultyLevel: number;
}

/**
 * ユーザーと運営の単語から5問のクイズデータを生成する
 * @param userId ユーザーID (string型で受け取り)
 * @returns 5つのクイズデータの配列
 */
export async function generateQuizzes(userId: string): Promise<QuizResult[]> {
    const QUIZ_COUNT = 5;
    const numericUserId = parseInt(userId, 10);
    
    // ユーザーの単語
    const userWords: Word[] = await prisma.word.findMany({
        where: { userId: numericUserId },
    }) as Word[];
    
    // 運営が追加した単語
    const adminWords: Word[] = await prisma.word.findMany({
        where: { userId: null },
    }) as Word[];

    const allWords = [userWords, adminWords].flat();
    
    // 単語数不足チェック
    if(allWords.length < QUIZ_COUNT + 3){
        throw new Error(`クイズを生成するには単語が${QUIZ_COUNT + 3}つ以上必要です。`);
    }

    const quizzes: QuizResult[] = [];
    const usedCorrectWordIds = new Set<number>();
    const availableWords = shuffleArray(allWords);

    // 指定された数のクイズを生成
    for(let i = 0; i < QUIZ_COUNT; i++){
        let correctWord: Word | null = null;
        for(const word of availableWords){
            // まだ正解として使われていない単語を見つける
            if(!usedCorrectWordIds.has(word.id)){
                correctWord = word;
                usedCorrectWordIds.add(word.id);
                break;
            }
        }
        
        if(!correctWord){
            throw new Error(`クイズを生成できませんでした。`);
        }
        
        const question = correctWord.meaning;
        const correctAnswer = correctWord.word;
        const difficultyLevel = correctWord.difficultyLevel;
        
        // 不正解の選択肢の準備
        const otherWords = allWords.filter(word => word.id !== correctWord!.id);
        if(otherWords.length < 3){
            throw new Error(`クイズを生成するには不正解の単語が3つ以上必要です。`);
        }
        
        const incorrectAnswers: string[] = [];
        const usedWordsOption = new Set<string>();
        usedWordsOption.add(correctAnswer);
        
        // 不正解の単語をランダムに3つ選択
        const shuffledOtherWords = shuffleArray(otherWords);
        for(let j = 0; j < shuffledOtherWords.length && incorrectAnswers.length < 3; j++){
            const word = shuffledOtherWords[j].word;
            if(!usedWordsOption.has(word)){
                incorrectAnswers.push(word);
                usedWordsOption.add(word);
            }
        }
        
        if(incorrectAnswers.length < 3){
            throw new Error(`クイズを生成するには不正解の単語が3つ以上必要です。`);
        }
        
        // 正解と不正解を結合してシャッフル
        const options = shuffleArray([correctAnswer, ...incorrectAnswers]);
        
        // クイズデータを保存 (BigIntをシリアライズ)
        quizzes.push(serializeBigInt({
            wordId: correctWord.id,
            question: question,
            options: options,
            correctAnswer: correctAnswer,
            difficultyLevel: difficultyLevel,
        }) as QuizResult);
    }
    return quizzes;
}


// =================================================================
// 2. 解答履歴記録処理 (quiz_register.ts)
// =================================================================

/**
 * クイズの解答履歴をデータベースに記録する
 * @param userId ユーザーID
 * @param wordId 解答した単語ID
 * @param isCorrect 正解/不正解
 */
export async function registerQuizAnswerHistory(
  userId: number,
  wordId: number,
  isCorrect: boolean
): Promise<void> {
  if (isNaN(userId) || !wordId || typeof isCorrect === 'undefined') {
    throw new Error("Invalid data for history registration.");
  }

  // QuizHistoryテーブルに解答履歴を記録
  await prisma.quizHistory.create({
    data: {
      userId: userId,
      wordId: wordId,
      isCorrect: isCorrect,
      answeredAt: new Date(),
    },
  });
}


// =================================================================
// 3. 経験値加算 & レベルアップ処理 (exp_status.ts)
// =================================================================

interface ExpUpdateResult {
  userId: number;
  level: number;
  experience: number;
  levelStatusId: number | null;
  leveledUp: boolean;
  newCharacterImage: string | null;
  totalExperienceGained: number;
  lastUpdated: Date;
}

/**
 * 正解した難易度レベルに基づいて経験値を加算し、レベルアップ判定を行う
 * @param userId ユーザーID
 * @param correctDifficulties 正解した問題の難易度レベルのリスト
 * @returns 更新後のユーザー進捗とレベルアップ情報
 */
export async function updateExperienceAndLevel(
  userId: number,
  correctDifficulties: number[]
): Promise<ExpUpdateResult> {
  if (correctDifficulties.some((d) => typeof d !== 'number')) {
    throw new Error('Invalid input: All elements in correctDifficulties must be numbers.');
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let totalExperienceGained = 0;
    // 経験値設定の取得のために、存在する難易度レベルをユニーク化
    const uniqueDifficulties = [...new Set(correctDifficulties)];
    
    // 経験値の合計計算
    if (uniqueDifficulties.length > 0) {
      // 英単語の難易度に応じた経験値を取得
      const expSetting = await tx.experience.findMany({
        where: { difficultyLevel: { in: uniqueDifficulties } },
      });
      
      // 正解した問題の難易度リスト全体に対して経験値を加算
      for(const difficulty of correctDifficulties){
        const setting = expSetting.find(s => s.difficultyLevel === difficulty);
        if (setting) {
          totalExperienceGained += setting.getexperience;
        }else{
          // 経験値設定が見つからない場合はエラーとしてロールバック
          throw new Error(`Experience setting for difficulty level ${difficulty} not found.`);
        }
      }
    } else {
      console.log("No correct answers provided, total experience gained is 0.");
    }
        
    // 現在のユーザー進捗を取得 (ロックのためtransaction内で取得)
    let userCharacter = await tx.userCharacter.findUnique({
      where: { userId },
    });

    if (!userCharacter) {
      // ユーザー進捗がない場合は新規作成
      userCharacter = await tx.userCharacter.create({ data: { userId } });
    }

    // 経験値加算
    const newExperience = userCharacter.experience + totalExperienceGained;

    // レベルアップ判定
    const potentialNextLevels = await tx.levelStatus.findMany({
      where: {
        level: {
          gt: userCharacter.level,
        },
        requiredExperience: {
          lte: newExperience,
        },
      },
      orderBy: {
        level: 'desc',
      },
    });

    let newLevel = userCharacter.level;
    let leveledUp = false;
    let newCharacterImage: string | null = null;

    if (potentialNextLevels.length > 0) {
      newLevel = potentialNextLevels[0].level;
      leveledUp = true;
      newCharacterImage = potentialNextLevels[0].characterImage;
    }
    
    // 進捗の更新
    const updatedProgress = await tx.userCharacter.update({
      where: { userId },
      data: {
        experience: newExperience,
        level: newLevel,
        levelStatusId: newLevel,
      },
    });

    // レベルアップ情報を付加して返却
    return { ...updatedProgress, leveledUp, newCharacterImage, totalExperienceGained };
  });

  return result;
}