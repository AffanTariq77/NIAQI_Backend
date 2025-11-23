import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/order.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(req.user.userId, createOrderDto);
  }

  @Post("checkout")
  async checkoutFromCart(@Request() req) {
    return this.orderService.createOrderFromCart(req.user.userId);
  }

  @Get()
  async getUserOrders(@Request() req) {
    return this.orderService.getUserOrders(req.user.userId);
  }

  @Get(":orderId")
  async getOrderById(@Request() req, @Param("orderId") orderId: string) {
    return this.orderService.getOrderById(req.user.userId, orderId);
  }

  @Patch(":orderId/status")
  async updateOrderStatus(
    @Request() req,
    @Param("orderId") orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto
  ) {
    return this.orderService.updateOrderStatus(
      req.user.userId,
      orderId,
      updateOrderStatusDto
    );
  }
}
