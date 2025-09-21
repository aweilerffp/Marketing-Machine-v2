import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db'
    }
  }
});

async function updatePrompt() {
  try {
    // Read the fixed prompt
    const fixedPrompt = readFileSync('./fixed_prompt.txt', 'utf8');
    
    // Update the company's LinkedIn prompt
    const result = await prisma.company.update({
      where: { id: 'cmfcxem0r000inwbq5bf4knlf' },
      data: { customLinkedInPrompt: fixedPrompt }
    });
    
    console.log('✅ Successfully updated LinkedIn prompt for', result.name);
    console.log('📝 Prompt length:', fixedPrompt.length, 'characters');
    
    // Verify the validation strings are included
    const requiredElements = ['Hook:', 'Content Pillar:', 'Brand Voice'];
    const missingElements = requiredElements.filter(element => !fixedPrompt.includes(element));
    
    if (missingElements.length === 0) {
      console.log('✅ All required validation elements present:', requiredElements.join(', '));
    } else {
      console.log('❌ Missing validation elements:', missingElements.join(', '));
    }
    
  } catch (error) {
    console.error('❌ Error updating prompt:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePrompt();