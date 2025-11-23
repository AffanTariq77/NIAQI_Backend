import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  AddToCartDto,
  UpdateCartItemDto,
  CartResponseDto,
} from "./dto/cart.dto";

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId: string): Promise<CartResponseDto> {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            membershipPlan: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              membershipPlan: true,
            },
          },
        },
      });
    }

    return new CartResponseDto(cart);
  }

  async addToCart(
    userId: string,
    addToCartDto: AddToCartDto
  ): Promise<CartResponseDto> {
    const { membershipPlanId, quantity = 1 } = addToCartDto;

    // Verify membership plan exists
    const membershipPlan = await this.prisma.membershipPlan.findUnique({
      where: { id: membershipPlanId },
    });

    if (!membershipPlan) {
      throw new NotFoundException("Membership plan not found");
    }

    if (!membershipPlan.isActive) {
      throw new BadRequestException("This membership plan is not available");
    }

    // Get or create cart
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_membershipPlanId: {
          cartId: cart.id,
          membershipPlanId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          price: membershipPlan.currentPrice,
        },
      });
    } else {
      // Create new cart item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          membershipPlanId,
          quantity,
          price: membershipPlan.currentPrice,
        },
      });
    }

    return this.getOrCreateCart(userId);
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto
  ): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException("Cart not found");
    }

    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundException("Cart item not found");
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: updateCartItemDto.quantity },
    });

    return this.getOrCreateCart(userId);
  }

  async removeFromCart(
    userId: string,
    itemId: string
  ): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException("Cart not found");
    }

    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundException("Cart item not found");
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }
  }
}
