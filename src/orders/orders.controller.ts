import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post("checkout")
  async checkoutFromCart(@Request() req) {
    return this.ordersService.checkoutFromCart(req.user.id);
  }

  @Get()
  async getOrders(@Request() req) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get(":id")
  async getOrderById(@Request() req, @Param("id") id: string) {
    return this.ordersService.getOrderById(req.user.id, id);
  }
}
