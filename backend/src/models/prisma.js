import { PrismaClient } from '@prisma/client';

console.log(`🗃️ Prisma connecting to database: ${process.env.DATABASE_URL || 'default from schema.prisma'}`);

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error']
});

export default prisma;