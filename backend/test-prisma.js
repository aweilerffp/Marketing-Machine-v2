import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  },
  log: ['query', 'error']
});

async function testPrismaConnection() {
  try {
    console.log('🔍 Testing Prisma connection to database...');
    
    // Test 1: Count all companies
    const companyCount = await prisma.company.count();
    console.log(`📊 Total companies in database: ${companyCount}`);
    
    // Test 2: Get all companies with basic info
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        brandVoiceData: true
      }
    });
    console.log(`📋 Companies found:`, companies.map(c => ({
      id: c.id,
      name: c.name,
      userId: c.userId,
      hasBrandVoice: !!c.brandVoiceData
    })));
    
    // Test 3: Count all users  
    const userCount = await prisma.user.count();
    console.log(`👥 Total users in database: ${userCount}`);
    
    // Test 4: Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true
      }
    });
    console.log(`👤 Users found:`, users);
    
    // Test 5: Try to find Emplicit company specifically
    const emplicityCompany = await prisma.company.findFirst({
      where: { name: 'Emplicit' }
    });
    console.log(`🏢 Emplicit company found:`, emplicityCompany ? 'YES' : 'NO');
    if (emplicityCompany) {
      console.log(`   - ID: ${emplicityCompany.id}`);
      console.log(`   - Name: ${emplicityCompany.name}`);
      console.log(`   - User ID: ${emplicityCompany.userId}`);
      console.log(`   - Has brand voice: ${!!emplicityCompany.brandVoiceData}`);
    }
    
  } catch (error) {
    console.error('❌ Prisma test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();