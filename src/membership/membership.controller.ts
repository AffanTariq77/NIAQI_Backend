import { Controller, Get, Param } from "@nestjs/common";
import { MembershipService } from "./membership.service";

@Controller("membership")
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get("plans")
  async getAllPlans() {
    return this.membershipService.getAllPlans();
  }

  @Get("plans/:id")
  async getPlanById(@Param("id") id: string) {
    return this.membershipService.getPlanById(id);
  }

  @Get("plans/type/:type")
  async getPlanByType(@Param("type") type: string) {
    return this.membershipService.getPlanByType(type);
  }
}
