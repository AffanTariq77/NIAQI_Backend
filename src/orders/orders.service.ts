import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async checkoutFromCart(userId: string) {
    // Get user's cart with items
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            membershipPlan: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discount = 0;
    const total = subtotal - discount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          orderNumber,
          status: "COMPLETED", // Set to COMPLETED since we're processing immediately
          subtotal,
          discount,
          total,
          items: {
            create: cart.items.map((item) => ({
              membershipPlanId: item.membershipPlanId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
              membershipPlan: true,
            },
          },
        },
      });

      // Update user's membership type based on the highest tier purchased
      // Determine the highest membership tier from cart items
      const membershipTypes = cart.items.map(
        (item) => item.membershipPlan.type
      );

      // Priority order: PREMIUM_PLUS > PREMIUM > BASIC
      let newMembershipType = "BASIC";
      if (membershipTypes.includes("PREMIUM_PLUS")) {
        newMembershipType = "PREMIUM_PLUS";
      } else if (membershipTypes.includes("PREMIUM")) {
        newMembershipType = "PREMIUM";
      }

      // Update user's membership type
      await tx.user.update({
        where: { id: userId },
        data: {
          membershipType: newMembershipType as any,
        },
      });

      // Clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return order;
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            membershipPlan: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            membershipPlan: true,
          },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }
}
