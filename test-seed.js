const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding membership plans...');

  const basic = await prisma.membershipPlan.upsert({
    where: { type: 'BASIC' },
    update: {},
    create: {
      name: 'NIAQI Basic Membership',
      type: 'BASIC',
      description: 'Access to essential nursing resources and community',
      features: ['Access to basic nursing resources', 'Community forum access', 'Monthly newsletter', 'Basic course materials'],
      currentPrice: 29.99,
      oldPrice: 39.99,
      durationMonths: 1,
      isActive: true,
    },
  });

  const premium = await prisma.membershipPlan.upsert({
    where: { type: 'PREMIUM' },
    update: {},
    create: {
      name: 'NIAQI Premium Membership',
      type: 'PREMIUM',
      description: 'Enhanced access with exclusive content and features',
      features: ['All Basic features', 'Access to premium courses', 'Live webinar access', 'Priority support', 'Downloadable study materials', 'Certificate of completion'],
      currentPrice: 49.99,
      oldPrice: 59.99,
      durationMonths: 1,
      isActive: true,
    },
  });

  const premiumPlus = await prisma.membershipPlan.upsert({
    where: { type: 'PREMIUM_PLUS' },
    update: {},
    create: {
      name: 'NIAQI Premium Plus Membership',
      type: 'PREMIUM_PLUS',
      description: 'Ultimate access with all features and personalized support',
      features: ['All Premium features', 'One-on-one mentorship', 'Career coaching sessions', 'Exclusive networking events', 'Advanced certification programs', 'Lifetime resource access', 'Custom learning path'],
      currentPrice: 99.99,
      oldPrice: 119.99,
      durationMonths: 1,
      isActive: true,
    },
  });

  console.log('✅ Membership plans seeded:', { basic, premium, premiumPlus });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
