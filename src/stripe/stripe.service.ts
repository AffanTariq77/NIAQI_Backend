import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY");

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2025-11-17.clover",
    });

    this.logger.log("✅ Stripe initialized successfully");
  }

  /**
   * Create a Payment Intent for membership purchase
   */
  async createPaymentIntent(
    userId: string,
    amount: number,
    membershipPlanId: string,
    membershipPlanName: string
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException("User not found");
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userId,
          userEmail: user.email,
          userName: user.name,
          membershipPlanId: membershipPlanId,
          membershipPlanName: membershipPlanName,
        },
        description: `${membershipPlanName} - ${user.email}`,
      });

      this.logger.log(
        `✅ Payment Intent created: ${paymentIntent.id} for $${amount}`
      );

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      this.logger.error("❌ Error creating payment intent:", error);
      throw new BadRequestException(
        `Failed to create payment intent: ${error.message}`
      );
    }
  }

  /**
   * Create checkout session from cart
   */
  async createCheckoutSessionFromCart(userId: string): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
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

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Get first item (should only be one membership)
    const firstItem = cart.items[0];

    return this.createPaymentIntent(
      userId,
      total,
      firstItem.membershipPlanId,
      firstItem.membershipPlan.name
    );
  }

  /**
   * Verify payment and complete order
   */
  async verifyPaymentAndCreateOrder(
    paymentIntentId: string,
    userId: string
  ): Promise<any> {
    try {
      // Retrieve payment intent from Stripe
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        throw new BadRequestException(
          `Payment not successful. Status: ${paymentIntent.status}`
        );
      }

      // Verify user matches
      if (paymentIntent.metadata.userId !== userId) {
        throw new BadRequestException("Payment does not belong to this user");
      }

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
            status: "COMPLETED",
            paymentStatus: "COMPLETED",
            subtotal,
            discount,
            total,
            paymentMethod: "stripe",
            transactionId: paymentIntentId,
            completedAt: new Date(),
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

        // Update user membership to the purchased tier
        const membershipPlanId = cart.items[0].membershipPlanId;
        const membershipPlan = await tx.membershipPlan.findUnique({
          where: { id: membershipPlanId },
        });

        if (membershipPlan) {
          await tx.user.update({
            where: { id: userId },
            data: {
              membershipType: membershipPlan.type,
            },
          });

          this.logger.log(
            `✅ User ${userId} membership upgraded to ${membershipPlan.type}`
          );
        }

        // Clear the cart
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        return newOrder;
      });

      this.logger.log(`✅ Order created successfully: ${orderNumber}`);

      return order;
    } catch (error: any) {
      this.logger.error("❌ Error verifying payment:", error);
      throw new BadRequestException(
        `Failed to verify payment: ${error.message}`
      );
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    paymentIntentId: string
  ): Promise<{ status: string; amount: number }> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert from cents
      };
    } catch (error: any) {
      this.logger.error("❌ Error retrieving payment status:", error);
      throw new BadRequestException(
        `Failed to get payment status: ${error.message}`
      );
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentIntentId: string): Promise<any> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      this.logger.log(`✅ Refund created: ${refund.id}`);

      return refund;
    } catch (error: any) {
      this.logger.error("❌ Error creating refund:", error);
      throw new BadRequestException(`Failed to refund: ${error.message}`);
    }
  }
}
