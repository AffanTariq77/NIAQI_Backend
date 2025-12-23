import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { CartModule } from "./cart/cart.module";
import { MembershipModule } from "./membership/membership.module";
import { OrdersModule } from "./orders/orders.module";
import { DocumentsModule } from "./documents/documents.module";
import { StripeModule } from "./stripe/stripe.module";
import { KajabiModule } from "./kajabi/kajabi.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrismaModule,
    AuthModule,
    CartModule,
    MembershipModule,
    OrdersModule,
    DocumentsModule,
    StripeModule,
    KajabiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
