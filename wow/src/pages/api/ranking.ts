import {PrismaClient} from '@/generated/prisma';
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){
    if(req.method=='GET'){
        try{
            //レベルの降順で取得
            const ranking=await prisma.userCharacter.findMany({
                include:{
                    user:{
                        select:{
                            username:true,
                        },
                    },
                    levelStatus:{
                        select:{
                            characterImage:true,
                        }
                    },
                },
                orderBy:{
                    level: 'desc',
                },
                take:10, // 上位10人を取得
            });

            const formattedRanking=ranking.map(item=>({
                userId: item.userId,
                username: item.user.username,
                level: item.level,
                characterImage: item.levelStatus?.characterImage || '', // 画像URLを追加
            }));
            res.status(200).json(formattedRanking);
        }catch(error){
            console.error('Error fetching ranking:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }else{
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}

