// Test the generateEnhancedLinkedInPost function
import { generateEnhancedLinkedInPost } from './src/services/ai/contentGeneration.js';

const testBrandVoice = {
  industry: 'Amazon Selling',
  targetAudience: 'Amazon sellers',
  companyName: 'FlatFilePro'
};

const result = await generateEnhancedLinkedInPost(
  'Test hook about catalog management',
  'Product Updates',
  testBrandVoice,
  'Test meeting summary'
);

console.log('Result:', result);
