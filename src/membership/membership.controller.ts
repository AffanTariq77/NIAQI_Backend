import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { MembershipService } from "./membership.service";
import {
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
} from "./dto/membership.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("membership")
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  @Get("plans")
  async getAllMembershipPlans() {
    return this.membershipService.getAllMembershipPlans();
  }

  @Get("plans/:id")
  async getMembershipPlanById(@Param("id") id: string) {
    return this.membershipService.getMembershipPlanById(id);
  }

  @Get("plans/type/:type")
  async getMembershipPlanByType(@Param("type") type: string) {
    return this.membershipService.getMembershipPlanByType(type);
  }

  @Post("plans")
  @UseGuards(JwtAuthGuard)
  async createMembershipPlan(
    @Body() createMembershipPlanDto: CreateMembershipPlanDto
  ) {
    return this.membershipService.createMembershipPlan(createMembershipPlanDto);
  }

  @Patch("plans/:id")
  @UseGuards(JwtAuthGuard)
  async updateMembershipPlan(
    @Param("id") id: string,
    @Body() updateMembershipPlanDto: UpdateMembershipPlanDto
  ) {
    return this.membershipService.updateMembershipPlan(
      id,
      updateMembershipPlanDto
    );
  }

  @Delete("plans/:id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMembershipPlan(@Param("id") id: string) {
    await this.membershipService.deleteMembershipPlan(id);
  }
}
