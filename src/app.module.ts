import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { CartModule } from "./cart/cart.module";
import { OrderModule } from "./order/order.module";
import { MembershipModule } from "./membership/membership.module";
import { StudentProfileModule } from "./student-profile/student-profile.module";
import { GoogleDriveModule } from "./google-drive/google-drive.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrismaModule,
    AuthModule,
    CartModule,
    OrderModule,
    MembershipModule,
    StudentProfileModule,
    GoogleDriveModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
