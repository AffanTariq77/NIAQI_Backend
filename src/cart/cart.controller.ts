import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddToCartDto, UpdateCartItemDto } from "./dto/cart.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCart(@Request() req) {
    return this.cartService.getOrCreateCart(req.user.userId);
  }

  @Post("add")
  async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Patch("items/:itemId")
  async updateCartItem(
    @Request() req,
    @Param("itemId") itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto
  ) {
    return this.cartService.updateCartItem(
      req.user.userId,
      itemId,
      updateCartItemDto
    );
  }

  @Delete("items/:itemId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromCart(@Request() req, @Param("itemId") itemId: string) {
    await this.cartService.removeFromCart(req.user.userId, itemId);
  }

  @Delete("clear")
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(@Request() req) {
    await this.cartService.clearCart(req.user.userId);
  }
}
