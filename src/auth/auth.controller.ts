import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import {
  SignUpDto,
  SignInDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ConfirmEmailDto,
  RefreshTokenDto,
} from "./dto/auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  @Post("signup")
  async signUp(@Body() signUpDto: SignUpDto) {
    console.log(
      "📥 Signup request received:",
      JSON.stringify(signUpDto, null, 2)
    );
    return this.authService.signUp(signUpDto);
  }

  @Post("signin")
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const message = await this.authService.forgotPassword(forgotPasswordDto);
    return { message };
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const message = await this.authService.resetPassword(resetPasswordDto);
    return { message };
  }

  @Post("confirm-email")
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    const message = await this.authService.confirmEmail(confirmEmailDto);
    return { message };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req) {
    return this.authService.getCurrentUser(req.user.id);
  }

  // Google OAuth endpoints
  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() {
    // Initiates the Google OAuth flow
    // The guard automatically redirects to Google
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    try {
      // Validate and process Google user
      const authResponse = await this.authService.validateGoogleUser(req.user);

      // Get frontend URL from config
      // In development: exp://192.168.x.x:8081
      // In production: niaqi://
      const frontendUrl = this.configService.get<string>("FRONTEND_URL");

      // ALSO set cookie for web-based auth (optional but good to have)
      res.cookie("auth_token", authResponse.accessToken, {
        httpOnly: true,
        secure: this.configService.get("NODE_ENV") === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      // Redirect to frontend with token in URL (for mobile deep linking)
      // Format: exp://192.168.x.x:8081/--/login?auth=success&token=JWT_TOKEN
      const redirectUrl = `${frontendUrl}login?auth=success&token=${authResponse.accessToken}&refreshToken=${authResponse.refreshToken}`;

      console.log("🔄 Redirecting to:", redirectUrl);
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error("❌ Google OAuth callback error:", error);
      // Redirect to frontend with error parameter
      const frontendUrl = this.configService.get<string>("FRONTEND_URL");
      return res.redirect(
        `${frontendUrl}login?auth=error&message=oauth_failed`
      );
    }
  }
}
