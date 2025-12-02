import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MembershipService {
  constructor(private prisma: PrismaService) {}

  async getAllPlans() {
    return this.prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { currentPrice: "asc" },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException("Membership plan not found");
    }

    return plan;
  }

  async getPlanByType(type: string) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: {
        type: type.toUpperCase() as any,
        isActive: true,
      },
    });

    if (!plan) {
      throw new NotFoundException(`Membership plan of type ${type} not found`);
    }

    return plan;
  }
}
