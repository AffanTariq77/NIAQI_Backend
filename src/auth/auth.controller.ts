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
  async googleAuth(@Req() req) {
    // Initiates the Google OAuth flow
    // The guard automatically redirects to Google
    // Store redirect_uri from query params for later use
    if (req.query.redirect_uri) {
      req.session = req.session || {};
      req.session.redirect_uri = req.query.redirect_uri;
    }
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    try {
      // Validate and process Google user
      const authResponse = await this.authService.validateGoogleUser(req.user);

      // Get redirect URI from session or use default
      const customRedirectUri = req.session?.redirect_uri;
      const frontendUrl = this.configService.get<string>("FRONTEND_URL");
      
      // Use custom redirect URI if provided, otherwise use default
      const baseRedirectUrl = customRedirectUri || `${frontendUrl}login`;

      // ALSO set cookie for web-based auth (optional but good to have)
      res.cookie("auth_token", authResponse.accessToken, {
        httpOnly: true,
        secure: this.configService.get("NODE_ENV") === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      // Build redirect URL with query params
      // For Expo AuthSession: niaqi://login?auth=success&token=...
      const separator = baseRedirectUrl.includes('?') ? '&' : '?';
      const redirectUrl = `${baseRedirectUrl}${separator}auth=success&token=${authResponse.accessToken}&refreshToken=${authResponse.refreshToken}`;

      console.log("🔄 Redirecting to:", redirectUrl);
      
      // Clear the redirect_uri from session
      if (req.session?.redirect_uri) {
        delete req.session.redirect_uri;
      }
      
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error("❌ Google OAuth callback error:", error);
      
      // Get redirect URI from session or use default
      const customRedirectUri = req.session?.redirect_uri;
      const frontendUrl = this.configService.get<string>("FRONTEND_URL");
      const baseRedirectUrl = customRedirectUri || `${frontendUrl}login`;
      
      const separator = baseRedirectUrl.includes('?') ? '&' : '?';
      return res.redirect(
        `${baseRedirectUrl}${separator}auth=error&message=oauth_failed`
      );
    }
  }

  @Get("google/mobile-callback")
  @UseGuards(AuthGuard("google"))
  async googleMobileCallback(@Req() req, @Res() res: Response) {
    try {
      // Validate and process Google user
      const authResponse = await this.authService.validateGoogleUser(req.user);

      // Return HTML page that redirects to mobile app
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Authenticating...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            .spinner {
              border: 4px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              border-top: 4px solid white;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h2>Authentication Successful!</h2>
            <p>Redirecting you back to the app...</p>
          </div>
          <script>
            // Redirect to mobile app with tokens
            const appUrl = 'niaqi://login?auth=success&token=${encodeURIComponent(authResponse.accessToken)}&refreshToken=${encodeURIComponent(authResponse.refreshToken)}';
            console.log('Redirecting to:', appUrl);
            window.location.href = appUrl;
            
            // Fallback: close window after 3 seconds if redirect doesn't work
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
        </html>
      `;

      return res.send(html);
    } catch (error) {
      console.error("❌ Google Mobile OAuth callback error:", error);
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Authentication Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>⚠️ Authentication Failed</h2>
            <p>Please try again</p>
          </div>
          <script>
            const appUrl = 'niaqi://login?auth=error&message=oauth_failed';
            window.location.href = appUrl;
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
        </html>
      `;

      return res.send(html);
    }
  }
}
