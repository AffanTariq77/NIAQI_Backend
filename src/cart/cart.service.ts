import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
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

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
        },
        include: {
          items: {
            include: {
              membershipPlan: true,
            },
          },
        },
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      ...cart,
      subtotal,
      itemCount,
    };
  }

  async addToCart(
    userId: string,
    membershipPlanId: string,
    quantity: number = 1
  ) {
    // Validate membership plan exists
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: membershipPlanId },
    });

    if (!plan) {
      throw new NotFoundException("Membership plan not found");
    }

    if (!plan.isActive) {
      throw new BadRequestException("This membership plan is not available");
    }

    // Get or create cart
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

    // Membership hierarchy for comparison
    const membershipHierarchy = {
      BASIC: 1,
      PREMIUM: 2,
      PREMIUM_PLUS: 3,
    };

    const newPlanLevel =
      membershipHierarchy[plan.type as keyof typeof membershipHierarchy] || 0;

    // Remove all existing membership items that are lower or equal to the new plan
    const itemsToRemove = cart.items.filter((item) => {
      const existingLevel =
        membershipHierarchy[
          item.membershipPlan.type as keyof typeof membershipHierarchy
        ] || 0;
      return existingLevel <= newPlanLevel;
    });

    // Delete the lower/equal tier items
    if (itemsToRemove.length > 0) {
      await this.prisma.cartItem.deleteMany({
        where: {
          id: {
            in: itemsToRemove.map((item) => item.id),
          },
        },
      });
    }

    // Add the new membership plan (it will always be added since we removed conflicting ones)
    await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        membershipPlanId,
        quantity,
        price: plan.currentPrice,
      },
    });

    return this.getCart(userId);
  }

  async updateCartItem(userId: string, itemId: string, quantity: number) {
    if (quantity < 1) {
      throw new BadRequestException("Quantity must be at least 1");
    }

    // Verify cart ownership
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException("Cart item not found");
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeFromCart(userId: string, itemId: string) {
    // Verify cart ownership
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException("Cart item not found");
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(userId: string) {
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
