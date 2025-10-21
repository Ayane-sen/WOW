// authController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * ログイン処理とJWT発行
 */
export const unityLogin = async (req: Request, res: Response) => {
    // Next.js API Routesと違い、メソッドチェックはrouter側で処理されるが、念のため
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ 
            where: { email },
            include: {userCharacter: true} 
        });

        if (!user) {
            return res.status(401).json({ message: 'ユーザーが見つかりません' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'パスワードが違います' });
        }

        // JWT発行
        console.log('JWT_SECRET IS:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            process.env.JWT_SECRET!, 
            { expiresIn: '7d' }
        );

        return res.status(200).json({ 
            token,
            username: user.username,
            level: user.userCharacter?.level || 1
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'ログイン処理中にエラーが発生しました' });
    }
};