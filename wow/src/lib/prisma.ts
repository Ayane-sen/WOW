// src/lib/prisma.ts (新しいファイルを作成)

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient({
    log: ['warn', 'error'],
});

export default prisma;