import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderResponseDto,
} from "./dto/order.dto";
import { MembershipType, OrderStatus, PaymentStatus } from "@prisma/client";

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORD-${timestamp}-${random}`;
  }

  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto
  ): Promise<OrderResponseDto> {
    const { items, ...orderData } = createOrderDto;

    // Verify all membership plans exist
    const membershipPlanIds = items.map((item) => item.membershipPlanId);
    const membershipPlans = await this.prisma.membershipPlan.findMany({
      where: { id: { in: membershipPlanIds } },
    });

    if (membershipPlans.length !== membershipPlanIds.length) {
      throw new BadRequestException("One or more membership plans not found");
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discount = 0; // Can be calculated based on promo codes, etc.
    const total = subtotal - discount;

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        userId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal,
        discount,
        total,
        ...orderData,
        items: {
          create: items.map((item) => ({
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

    // If order is for a membership, update user's membership type
    if (items.length > 0) {
      const membershipPlan = membershipPlans.find(
        (plan) => plan.id === items[0].membershipPlanId
      );
      if (membershipPlan) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { membershipType: membershipPlan.type },
        });
      }
    }

    return new OrderResponseDto(order);
  }

  async getOrderById(
    userId: string,
    orderId: string
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
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

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return new OrderResponseDto(order);
  }

  async getUserOrders(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            membershipPlan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => new OrderResponseDto(order));
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const updateData: any = {
      status: updateOrderStatusDto.status,
    };

    if (updateOrderStatusDto.paymentStatus) {
      updateData.paymentStatus = updateOrderStatusDto.paymentStatus;
    }

    if (updateOrderStatusDto.transactionId) {
      updateData.transactionId = updateOrderStatusDto.transactionId;
    }

    if (updateOrderStatusDto.status === OrderStatus.COMPLETED) {
      updateData.completedAt = new Date();

      // Update user's membership when order is completed
      const orderWithItems = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              membershipPlan: true,
            },
          },
        },
      });

      if (orderWithItems && orderWithItems.items.length > 0) {
        const membershipPlan = orderWithItems.items[0].membershipPlan;
        if (membershipPlan) {
          await this.prisma.user.update({
            where: { id: userId },
            data: { membershipType: membershipPlan.type },
          });
        }
      }
    }

    if (updateOrderStatusDto.status === OrderStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            membershipPlan: true,
          },
        },
      },
    });

    return new OrderResponseDto(updatedOrder);
  }

  async createOrderFromCart(userId: string): Promise<OrderResponseDto> {
    // Get user's cart
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

    // Get user info for billing
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Create order from cart items
    const createOrderDto: CreateOrderDto = {
      items: cart.items.map((item) => ({
        membershipPlanId: item.membershipPlanId,
        quantity: item.quantity,
        price: item.price,
      })),
      billingName: user?.name,
      billingEmail: user?.email,
    };

    const order = await this.createOrder(userId, createOrderDto);

    // Automatically mark order as completed and update payment status
    // This simulates a successful payment for demo purposes
    const completedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        items: {
          include: {
            membershipPlan: true,
          },
        },
      },
    });

    // Clear cart after successful order
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return new OrderResponseDto(completedOrder);
  }
}
