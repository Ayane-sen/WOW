import { Router } from 'express';
// コントローラーをインポート
import { getQuizController } from '../controllers/getQuizController';
import { registerAnswerController } from '../controllers/registerAnswerController';
import { updateExpController } from '../controllers/updateExpController';
// 認証ミドルウェアをインポート (提供されたファイル構成に基づき)
import { authenticateToken } from '../middleware/authMiddleware'; 

const router = Router();

// クイズの取得: 認証が必要
router.get('/question', authenticateToken, getQuizController);

// 解答履歴の登録: 認証が必要
router.post('/quiz-register', authenticateToken, registerAnswerController);

// 経験値の更新: 認証が必要 (ここでは簡略化のためauthMiddlewareを通していますが、設計に応じて調整)
router.post('/exp-status', authenticateToken, updateExpController);

export default router;