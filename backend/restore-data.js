import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  },
  log: ['query', 'error']
});

// Your Emplicit brand voice data (extracted before reset)
const BRAND_VOICE_DATA = `{"name":"Emplicit","core_message":"Emplicit makes immigration simple","tone":"professional yet approachable","style":"clear, direct, confident","values":["transparency","innovation","empowerment","efficiency","fairness","integrity"],"messaging_themes":["simplicity through technology","empowering immigrants","reducing complexity","building trust","breaking down barriers","innovative solutions"],"target_audience":[{"type":"Individual Immigrants","characteristics":["seeking visa guidance","overwhelmed by immigration processes","tech-savvy professionals","value transparency and simplicity"]},{"type":"Immigration Attorneys","characteristics":["need efficient case management","serve diverse clientele","value reliable technology","focus on client outcomes"]}],"brand_voice_guidelines":[{"principle":"Be Human-Centered","description":"Always lead with empathy and understanding of the immigration journey"},{"principle":"Simplify Without Oversimplifying","description":"Make complex immigration concepts accessible while maintaining accuracy"},{"principle":"Build Confidence","description":"Use language that empowers and reassures users about their immigration process"},{"principle":"Demonstrate Expertise","description":"Show deep understanding of immigration law while remaining approachable"},{"principle":"Focus on Outcomes","description":"Emphasize the positive results and life changes our platform enables"}],"content_pillars":[{"name":"Immigration Expertise","description":"Share insights about immigration law, policy changes, and process guidance"},{"name":"Technology Innovation","description":"Highlight how we're revolutionizing immigration through smart technology"},{"name":"Success Stories","description":"Showcase real client outcomes and transformative immigration journeys"},{"name":"Simplification","description":"Demonstrate how we make complex immigration processes more manageable"}],"key_differentiators":["First comprehensive immigration platform","AI-powered case assessment","Streamlined attorney-client collaboration","End-to-end process management","Transparent pricing and timeline"],"avoid_language":["bureaucratic jargon","overly technical legal terms","language that creates anxiety","generic corporate speak","false promises about immigration outcomes"],"preferred_language":["clear pathways","streamlined process","personalized guidance","trusted expertise","transparent approach","innovative solutions"]}`;

async function restoreData() {
  try {
    console.log('🔄 Restoring development data...');
    
    // 1. Create dev user
    console.log('👤 Creating dev user...');
    const user = await prisma.user.create({
      data: {
        id: 'cmfrpowq30001nwm0uu7887qf',
        clerkId: 'dev_user_123',
        email: 'dev@example.com'
      }
    });
    console.log(`✅ Created user: ${user.email}`);
    
    // 2. Create Emplicit company with brand voice data
    console.log('🏢 Creating Emplicit company...');
    const company = await prisma.company.create({
      data: {
        userId: user.id,
        name: 'Emplicit',
        brandVoiceData: JSON.parse(BRAND_VOICE_DATA),
        contentPillars: JSON.stringify([
          "Immigration Expertise",
          "Technology Innovation", 
          "Success Stories",
          "Simplification"
        ]),
        postingSchedule: {
          linkedin: {
            enabled: true,
            times: ["09:00", "14:00", "17:00"],
            timezone: "America/New_York"
          }
        },
        supportedPlatforms: JSON.stringify(["linkedin"]),
        webhookActive: true
      }
    });
    console.log(`✅ Created company: ${company.name}`);
    console.log(`📝 Brand voice data length: ${JSON.stringify(company.brandVoiceData).length} characters`);
    
    // 3. Verify everything works
    console.log('🔍 Verifying Prisma can read the data...');
    const verification = await prisma.company.findFirst({
      where: { name: 'Emplicit' },
      include: { user: true }
    });
    
    if (verification) {
      console.log('✅ SUCCESS! Prisma can now read the Emplicit company');
      console.log(`   - Company: ${verification.name}`);
      console.log(`   - User: ${verification.user.email}`);
      console.log(`   - Brand Voice: ${verification.brandVoiceData ? 'Present' : 'Missing'}`);
    } else {
      console.log('❌ ERROR: Could not verify data');
    }
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();