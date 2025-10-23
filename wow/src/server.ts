// server.ts
import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors'; // Unity WebGLからのリクエストを許可するため
import { unityLogin } from './controllers/authController';
import { getQuizData } from './controllers/quizController';
import { authenticateToken } from './middleware/authMiddleware';
import { addWord } from './controllers/createController';
import { getUserWords } from './controllers/get_wordController';
import { deleteWord } from './controllers/deletewordController';

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
app.get('/api/question', authenticateToken, getQuizData);
app.post('/api/addword', authenticateToken, addWord);
app.get('/api/getwords', authenticateToken, getUserWords);
app.delete('/api/delete_word/:id', authenticateToken, deleteWord);


app.listen(port, () => {
    console.log(`Express server running on http://localhost:${port}`);
    console.log(`API URL: http://localhost:${port}/api/...`);
    const secretStatus = process.env.JWT_SECRET ? "✅ SET" : "❌ NOT SET";
    console.log(`[DEBUG] JWT_SECRET Status: ${secretStatus}`);
});

// 環境変数などが読み込まれているか確認してから起動してください