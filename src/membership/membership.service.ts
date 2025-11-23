import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
  MembershipPlanResponseDto,
} from "./dto/membership.dto";

@Injectable()
export class MembershipService {
  constructor(private prisma: PrismaService) {}

  async getAllMembershipPlans(): Promise<MembershipPlanResponseDto[]> {
    const plans = await this.prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { currentPrice: "asc" },
    });

    return plans.map((plan) => new MembershipPlanResponseDto(plan));
  }

  async getMembershipPlanById(id: string): Promise<MembershipPlanResponseDto> {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException("Membership plan not found");
    }

    return new MembershipPlanResponseDto(plan);
  }

  async getMembershipPlanByType(
    type: string
  ): Promise<MembershipPlanResponseDto> {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { type: type as any },
    });

    if (!plan) {
      throw new NotFoundException("Membership plan not found");
    }

    return new MembershipPlanResponseDto(plan);
  }

  async createMembershipPlan(
    createMembershipPlanDto: CreateMembershipPlanDto
  ): Promise<MembershipPlanResponseDto> {
    const plan = await this.prisma.membershipPlan.create({
      data: {
        ...createMembershipPlanDto,
        durationMonths: createMembershipPlanDto.durationMonths || 1,
        isActive: createMembershipPlanDto.isActive ?? true,
      },
    });

    return new MembershipPlanResponseDto(plan);
  }

  async updateMembershipPlan(
    id: string,
    updateMembershipPlanDto: UpdateMembershipPlanDto
  ): Promise<MembershipPlanResponseDto> {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException("Membership plan not found");
    }

    const updatedPlan = await this.prisma.membershipPlan.update({
      where: { id },
      data: updateMembershipPlanDto,
    });

    return new MembershipPlanResponseDto(updatedPlan);
  }

  async deleteMembershipPlan(id: string): Promise<void> {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException("Membership plan not found");
    }

    // Soft delete by marking as inactive
    await this.prisma.membershipPlan.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
