import { PrismaClient, MembershipType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create membership plans
  const membershipPlans = [
    {
      name: "Basic Membership",
      type: MembershipType.BASIC,
      description: "Perfect for beginners who want to get started",
      features: [
        "Access to basic courses",
        "Community forum access",
        "Email support",
        "Monthly newsletter",
        "1 course completion certificate",
      ],
      currentPrice: 99,
      oldPrice: 199,
      durationMonths: 1,
      isActive: true,
    },
    {
      name: "Premium Membership",
      type: MembershipType.PREMIUM,
      description: "For serious learners who want more access",
      features: [
        "Access to all basic courses",
        "Access to premium courses",
        "Priority email support",
        "Weekly webinars",
        "5 course completion certificates",
        "Downloadable resources",
        "10% discount on workshops",
      ],
      currentPrice: 198,
      oldPrice: 299,
      durationMonths: 3,
      isActive: true,
    },
    {
      name: "Premium Plus Membership",
      type: MembershipType.PREMIUM_PLUS,
      description: "The ultimate learning experience with everything included",
      features: [
        "Access to all courses (basic + premium)",
        "Access to exclusive masterclasses",
        "1-on-1 mentorship sessions (2 per month)",
        "24/7 priority support",
        "Unlimited course certificates",
        "All downloadable resources",
        "Early access to new courses",
        "20% discount on all workshops",
        "Networking events access",
        "Career guidance sessions",
      ],
      currentPrice: 297,
      oldPrice: 399,
      durationMonths: 6,
      isActive: true,
    },
  ];

  for (const planData of membershipPlans) {
    const existingPlan = await prisma.membershipPlan.findUnique({
      where: { type: planData.type },
    });

    if (existingPlan) {
      console.log(
        `✅ Membership plan "${planData.name}" already exists, updating...`
      );
      await prisma.membershipPlan.update({
        where: { type: planData.type },
        data: planData,
      });
    } else {
      console.log(`✨ Creating membership plan "${planData.name}"...`);
      await prisma.membershipPlan.create({
        data: planData,
      });
    }
  }

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
