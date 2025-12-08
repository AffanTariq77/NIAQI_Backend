import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("stripe")
@UseGuards(JwtAuthGuard)
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  /**
   * Create payment intent from cart
   */
  @Post("create-payment-intent")
  async createPaymentIntent(@Request() req) {
    return this.stripeService.createCheckoutSessionFromCart(req.user.id);
  }

  /**
   * Verify payment and create order
   */
  @Post("verify-payment")
  async verifyPayment(
    @Request() req,
    @Body() body: { paymentIntentId: string }
  ) {
    return this.stripeService.verifyPaymentAndCreateOrder(
      body.paymentIntentId,
      req.user.id
    );
  }

  /**
   * Get payment status
   */
  @Get("payment-status/:paymentIntentId")
  async getPaymentStatus(@Param("paymentIntentId") paymentIntentId: string) {
    return this.stripeService.getPaymentStatus(paymentIntentId);
  }

  /**
   * Refund a payment (admin/support only - add additional guards as needed)
   */
  @Post("refund")
  async refundPayment(@Body() body: { paymentIntentId: string }) {
    return this.stripeService.refundPayment(body.paymentIntentId);
  }
}
