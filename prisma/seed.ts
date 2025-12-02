import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding membership plans...");

  // Create Basic Membership
  const basic = await prisma.membershipPlan.upsert({
    where: { type: "BASIC" as any },
    update: {},
    create: {
      name: "NIAQI Basic Membership",
      type: "BASIC" as any,
      description: "Access to essential nursing resources and community",
      features: [
        "Access to basic nursing resources",
        "Community forum access",
        "Monthly newsletter",
        "Basic course materials",
      ],
      currentPrice: 29.99,
      oldPrice: 39.99,
      durationMonths: 1,
      isActive: true,
    },
  });

  // Create Premium Membership
  const premium = await prisma.membershipPlan.upsert({
    where: { type: "PREMIUM" as any },
    update: {},
    create: {
      name: "NIAQI Premium Membership",
      type: "PREMIUM" as any,
      description: "Enhanced access with exclusive content and features",
      features: [
        "All Basic features",
        "Access to premium courses",
        "Live webinar access",
        "Priority support",
        "Downloadable study materials",
        "Certificate of completion",
      ],
      currentPrice: 49.99,
      oldPrice: 59.99,
      durationMonths: 1,
      isActive: true,
    },
  });

  // Create Premium Plus Membership
  const premiumPlus = await prisma.membershipPlan.upsert({
    where: { type: "PREMIUM_PLUS" as any },
    update: {},
    create: {
      name: "NIAQI Premium Plus Membership",
      type: "PREMIUM_PLUS" as any,
      description: "Ultimate access with all features and personalized support",
      features: [
        "All Premium features",
        "One-on-one mentorship",
        "Career coaching sessions",
        "Exclusive networking events",
        "Advanced certification programs",
        "Lifetime resource access",
        "Custom learning path",
      ],
      currentPrice: 99.99,
      oldPrice: 119.99,
      durationMonths: 1,
      isActive: true,
    },
  });

  console.log("✅ Membership plans seeded:", { basic, premium, premiumPlus });
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
