import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post("add")
  async addToCart(
    @Request() req,
    @Body() body: { membershipPlanId: string; quantity?: number }
  ) {
    return this.cartService.addToCart(
      req.user.id,
      body.membershipPlanId,
      body.quantity || 1
    );
  }

  @Patch("items/:itemId")
  async updateCartItem(
    @Request() req,
    @Param("itemId") itemId: string,
    @Body() body: { quantity: number }
  ) {
    return this.cartService.updateCartItem(req.user.id, itemId, body.quantity);
  }

  @Delete("items/:itemId")
  async removeFromCart(@Request() req, @Param("itemId") itemId: string) {
    await this.cartService.removeFromCart(req.user.id, itemId);
    return { message: "Item removed from cart" };
  }

  @Delete("clear")
  async clearCart(@Request() req) {
    await this.cartService.clearCart(req.user.id);
    return { message: "Cart cleared" };
  }
}
