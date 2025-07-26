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
  await prisma.word.deleteMany({});
  await prisma.questSession.deleteMany({}); // **QuestSessionをUserより先に削除**
  await prisma.user.deleteMany({});
  await prisma.levelStatus.deleteMany({});
  await prisma.experience.deleteMany({});
  await prisma.boss.deleteMany({});
  console.log('Existing data cleared.');

  // --- 2. LevelStatus データ (依存元のため最初に作成) ---
  // キャラクターのレベルごとのステータス
  await prisma.levelStatus.createMany({
    data: [
      {
        level: 1,
        requiredExperience: 0,
        characterImage: 'ハッカソンsmpl.gif',
        attackPower: 10,
        defensePower: 5,
        hp: 100,
        skillUnlocked: null,
      },
      {
        level: 2,
        requiredExperience: 200, // Lv1からLv2に必要な総経験値
        characterImage: 'https://example.com/char_lvl2.png',
        attackPower: 15,
        defensePower: 10,
        hp: 110,
        skillUnlocked: '集中力アップ',
      },
      {
        level: 3,
        requiredExperience: 400,
        characterImage: 'https://example.com/char_lvl3.png',
        attackPower: 20,
        defensePower: 15,
        hp: 120,
        skillUnlocked: '高速リピート',
      },
      {
        level: 4,
        requiredExperience: 600,
        characterImage: 'https://example.com/char_lvl4.png',
        attackPower: 25,
        defensePower: 20,
        hp: 130,
        skillUnlocked: 'ボーナス経験値',
      },
      {
        level: 5,
        requiredExperience: 800,
        characterImage: 'https://example.com/char_lvl5.png',
        attackPower: 30,
        defensePower: 25,
        hp: 140,
        skillUnlocked: null,
      },
      {
        level: 6,
        requiredExperience: 1000,
        characterImage: 'https://example.com/char_lvl5.png',
        attackPower: 35,
        defensePower: 30,
        hp: 150,
        skillUnlocked: null,
      },
      {
        level: 7,
        requiredExperience: 1200,
        characterImage: 'https://example.com/char_lvl5.png',
        attackPower: 40,
        defensePower: 35,
        hp: 160,
        skillUnlocked: null,
      },
      {
        level: 8,
        requiredExperience: 1400,
        characterImage: 'https://example.com/char_lvl5.png',
        attackPower: 45,
        defensePower: 40,
        hp: 170,
        skillUnlocked: null,
      },
      {
        level: 9,
        requiredExperience: 1600,
        characterImage: 'https://example.com/char_lvl5.png',
        attackPower: 50,
        defensePower: 45,
        hp: 180,
        skillUnlocked: null,
      },
      {
        level: 10,
        requiredExperience: 1800,
        characterImage: 'https://example.com/char_lvl5.png',
        attackPower: 55,
        defensePower: 50,
        hp: 190,
        skillUnlocked: null,
      },
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
      word: 'arrive',
      meaning: '到着する',
      difficultyLevel: 1,
      userId: null,
    },
  });
  const defaultWord2 = await prisma.word.create({
    data: {
      word: 'office',
      meaning: '事務所、会社',
      difficultyLevel: 1,
      userId: null,
    },
  });
  const defaultWord3 = await prisma.word.create({
    data: {
      word: 'meeting',
      meaning: '会議',
      difficultyLevel: 1,
      userId: null,
    },
  });
  const defaultWord4 = await prisma.word.create({
    data: {
      word: 'product',
      meaning: '製品',
      difficultyLevel: 1,
      userId: null,
    },
  });
  const defaultWord5 = await prisma.word.create({
    data: {
      word: 'customer',
      meaning: '顧客',
      difficultyLevel: 2,
      userId: null,
    },
  });
  const defaultWord6 = await prisma.word.create({
    data: {
      word: 'invoice',
      meaning: '請求書',
      difficultyLevel: 2,
      userId: null,
    },
  });
  const defaultWord7 = await prisma.word.create({
    data: {
      word: 'schedule',
      meaning: 'スケジュール',
      difficultyLevel: 2,
      userId: null,
    },
  });
  const defaultWord8 = await prisma.word.create({
    data: {
      word: 'request',
      meaning: '要求',
      difficultyLevel: 2,
      userId: null,
    },
  });
  const defaultWord9 = await prisma.word.create({
    data: {
      word: 'confirm',
      meaning: '確認する',
      difficultyLevel: 3,
      userId: null,
    },
  });
  const defaultWord10 = await prisma.word.create({
    data: {
      word: 'negotiate',
      meaning: '交渉する',
      difficultyLevel: 3,
      userId: null,
    },
  });
  const defaultWord11 = await prisma.word.create({
    data: {
      word: 'implement',
      meaning: '実施する',
      difficultyLevel: 3,
      userId: null,
    },
  });
  const defaultWord12 = await prisma.word.create({
    data: {
      word: 'evaluate',
      meaning: '評価する',
      difficultyLevel: 3,
      userId: null,
    },
  });
  const defaultWord13 = await prisma.word.create({
    data: {
      word: 'efficient',
      meaning: '効率的な',
      difficultyLevel: 4,
      userId: null,
    },
  });
  const defaultWord14 = await prisma.word.create({
    data: {
      word: 'allocate',
      meaning: '割り当てる',
      difficultyLevel: 4,
      userId: null,
    },
  });
  const defaultWord15 = await prisma.word.create({
    data: {
      word: 'comprehensive',
      meaning: '包括的な',
      difficultyLevel: 4,
      userId: null,
    },
  });
  const defaultWord16 = await prisma.word.create({
    data: {
      word: 'facilitate',
      meaning: '促進する',
      difficultyLevel: 4,
      userId: null,
    },
  });
  const defaultWord17 = await prisma.word.create({
    data: {
      word: 'contingency',
      meaning: '偶発事態',
      difficultyLevel: 5,
      userId: null,
    },
  });
  const defaultWord18 = await prisma.word.create({
    data: {
      word: 'mitigate',
      meaning: '軽減する',
      difficultyLevel: 5,
      userId: null,
    },
  });
  const defaultWord19 = await prisma.word.create({
    data: {
      word: 'diligence',
      meaning: '勤勉',
      difficultyLevel: 5,
      userId: null,
    },
  });
  const defaultWord20 = await prisma.word.create({
    data: {
      word: 'scrutinize',
      meaning: '綿密に調べる',
      difficultyLevel: 5,
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
      experience: 250,
      lastUpdated: new Date(),
    },
  });
  console.log(`Created character for ${user2.username}.`);
  // --- Experience データ ---
  await prisma.experience.createMany({
    data: [
      { difficultyLevel: 1, getexperience: 10 },
      { difficultyLevel: 2, getexperience: 20 },
      { difficultyLevel: 3, getexperience: 30 },
      { difficultyLevel: 4, getexperience: 40 },
      { difficultyLevel: 5, getexperience: 50 },
    ]
  });
  //ボスデータ
  await prisma.boss.create({
  data: {
    name: 'やさしいスライム',
    initialHp: 100, // 10問で倒すことを想定したHP
    attack: 5,      // ボスの攻撃力（低レベルユーザーでも耐えられるように低め）
    defense: 2,     // ボスの防御力（ユーザーの攻撃が通りやすいように低め）
    imageUrl: 'ハッカソンsmpl.gif', // 緑色のスライム
  },
});
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