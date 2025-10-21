// server.ts
import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors'; // Unity WebGLからのリクエストを許可するため
import { unityLogin } from './controllers/authController';
import { getQuizData } from './controllers/quizController';
import { authenticateToken } from './middleware/authMiddleware';

const app = express();
const port = 3000;

// CORS設定：Unity WebGLからのアクセスを許可
// 開発中は全て許可しますが、本番ではUnityホストのオリジンに限定すべきです
app.use(cors());

// リクエストボディをJSONとしてパースする
app.use(express.json()); 

// ★ API ルートの設定 ★

// ログインAPI (POST) : 認証は不要
app.post('/api/login', unityLogin);

// クイズAPI (GET) : 認証ミドルウェアを適用
// まず authenticateToken が実行され、認証が通れば getQuizData が実行される
app.get('/api/question', authenticateToken, getQuizData);


app.listen(port, () => {
    console.log(`Express server running on http://localhost:${port}`);
    console.log(`API URL: http://localhost:${port}/api/...`);
});

// 環境変数などが読み込まれているか確認してから起動してください