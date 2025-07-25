import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs' // パスワードハッシュ化ライブラリ

import dotenv from 'dotenv';
dotenv.config();

// Prisma Clientのインスタンスを作成
const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding started ---');

  // 1. 既存のデータをクリーンアップ (開発用なので毎回リセットする想定)
  // 依存関係のあるテーブルから順に削除 (外部キー制約のため)
  await prisma.quizHistory.deleteMany({});
  await prisma.userCharacter.deleteMany({});
  await prisma.word.deleteMany({}); // user_idがNULLのWordも対象になるため、Userより先に削除
  await prisma.user.deleteMany({});
  await prisma.levelStatus.deleteMany({});
  console.log('Existing data cleared.');

  // --- 2. LevelStatus データ (依存元のため最初に作成) ---
  // キャラクターのレベルごとのステータス
  await prisma.levelStatus.createMany({
    data: [
      {
        level: 1,
        requiredExperience: 0,
        characterImage: 'https://example.com/char_lvl1.png',
        attackPower: 10,
        defensePower: 5,
        hp: 100,
        skillUnlocked: null,
      },
      {
        level: 2,
        requiredExperience: 100, // Lv1からLv2に必要な総経験値
        characterImage: 'https://example.com/char_lvl2.png',
        attackPower: 15,
        defensePower: 7,
        hp: 110,
        skillUnlocked: '集中力アップ',
      },
      {
        level: 3,
        requiredExperience: 300,
        characterImage: 'https://example.com/char_lvl3.png',
        attackPower: 20,
        defensePower: 10,
        hp: 120,
        skillUnlocked: '高速リピート',
      },
      {
        level: 4,
        requiredExperience: 600,
        characterImage: 'https://example.com/char_lvl4.png',
        attackPower: 25,
        defensePower: 12,
        hp: 130,
        skillUnlocked: 'ボーナス経験値',
      },
      {
        level: 5,
        requiredExperience: 1000,
        characterImage: 'https://example.com/char_lvl5.png',
        attackPower: 30,
        defensePower: 15,
        hp: 140,
        skillUnlocked: '新コスチューム',
      },
      // 必要に応じてさらにレベルを追加
    ],
  });
  console.log('Level statuses created.');

  // --- 3. User データ ---
  // テストユーザーを作成
  const hashedPassword1 = await bcrypt.hash('testpass1', 10);
  const user1 = await prisma.user.create({
    data: {
      username: 'user_alice',
      email: 'alice@example.com',
      passwordHash: hashedPassword1,
      createdAt: new Date(), // @default(now()) で自動設定されるが、明示的に指定することも可能
    },
  });
  console.log(`Created user: ${user1.username}`);

  const hashedPassword2 = await bcrypt.hash('testpass2', 10);
  const user2 = await prisma.user.create({
    data: {
      username: 'user_bob',
      email: 'bob@example.com',
      passwordHash: hashedPassword2,
      createdAt: new Date(),
    },
  });
  console.log(`Created user: ${user2.username}`);

  // --- 4. Word データ ---
  // アプリデフォルトの単語
  const defaultWord1 = await prisma.word.create({
    data: {
      word: 'apple',
      meaning: 'りんご',
      difficultyLevel: 1,
      userId: null,
    },
  });
  const defaultWord2 = await prisma.word.create({
    data: {
      word: 'banana',
      meaning: 'バナナ',
      difficultyLevel: 1,
      userId: null,
    },
  });
  const defaultWord3 = await prisma.word.create({
    data: {
      word: 'computer',
      meaning: 'コンピューター',
      difficultyLevel: 2,
      userId: null,
    },
  });
  console.log('Created default words.');

  // user_alice が追加した単語の例
  const aliceWord1 = await prisma.word.create({
    data: {
      word: 'quantum',
      meaning: '量子',
      difficultyLevel: 4,
      userId: user1.id, // user_alice が追加
    },
  });
  console.log(`Created word by ${user1.username}: ${aliceWord1.word}`);

  // --- 5. UserCharacter データ ---
  // ユーザーの初期キャラクター情報
  await prisma.userCharacter.create({
    data: {
      userId: user1.id,
      level: 1,
      experience: 0,
      lastUpdated: new Date(), // @default(now()) @updatedAt で自動設定されるが、明示的に指定
    },
  });
  console.log(`Created character for ${user1.username}.`);

  await prisma.userCharacter.create({
    data: {
      userId: user2.id,
      level: 2, // Bobは少し進んでいる設定
      experience: 150,
      lastUpdated: new Date(),
    },
  });
  console.log(`Created character for ${user2.username}.`);

  // --- 6. QuizHistory データ (必要であれば) ---
  // テスト用のクイズ履歴
  await prisma.quizHistory.createMany({
    data: [
      { userId: user1.id, wordId: defaultWord1.id, isCorrect: true, answeredAt: new Date() },
      { userId: user1.id, wordId: defaultWord2.id, isCorrect: false, answeredAt: new Date() },
      { userId: user1.id, wordId: aliceWord1.id, isCorrect: true, answeredAt: new Date() }, // Aliceが自分の単語を正解
      { userId: user2.id, wordId: defaultWord1.id, isCorrect: true, answeredAt: new Date() },
      { userId: user2.id, wordId: defaultWord3.id, isCorrect: true, answeredAt: new Date() },
    ],
  });
  console.log('Created quiz histories.');

  console.log('--- Seeding finished ---');
}

// スクリプトの実行とエラーハンドリング
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });