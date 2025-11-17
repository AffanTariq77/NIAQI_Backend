import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import {
  SignUpDto,
  SignInDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ConfirmEmailDto,
  RefreshTokenDto,
} from "./dto/auth.dto";
import { AuthResponseDto, UserResponseDto } from "./dto/auth-response.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const { name, email, password, confirmPassword } = signUpDto;

    // Validate password match
    if (password !== confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email confirmation token
    const emailConfirmToken = randomBytes(32).toString("hex");

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailConfirmToken,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Save refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return new AuthResponseDto({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900, // 15 minutes
      user: new UserResponseDto({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailConfirmed: user.isEmailConfirmed,
        createdAt: user.createdAt,
      }),
    });
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    const { email, password } = signInDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Save refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return new AuthResponseDto({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900, // 15 minutes
      user: new UserResponseDto({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailConfirmed: user.isEmailConfirmed,
        createdAt: user.createdAt,
      }),
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<string> {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return "If an account exists with this email, a password reset link has been sent";
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Send email with reset token
    // For now, return token (remove this in production)
    return `Password reset token: ${resetToken} (Valid for 1 hour)`;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<string> {
    const { userId, token, newPassword, confirmPassword } = resetPasswordDto;

    // Validate password match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.resetToken || user.resetToken !== token) {
      throw new UnauthorizedException("Invalid or expired reset token");
    }

    // Check if token expired
    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      throw new UnauthorizedException("Reset token has expired");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return "Password reset successfully";
  }

  async confirmEmail(confirmEmailDto: ConfirmEmailDto): Promise<string> {
    const { userId, token } = confirmEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.emailConfirmToken || user.emailConfirmToken !== token) {
      throw new UnauthorizedException("Invalid confirmation token");
    }

    // Update user as confirmed
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isEmailConfirmed: true,
        emailConfirmToken: null,
      },
    });

    return "Email confirmed successfully";
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto
  ): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get("JWT_REFRESH_SECRET"),
      });

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Verify stored refresh token
      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email);

      // Update refresh token
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return new AuthResponseDto({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900,
        user: new UserResponseDto({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailConfirmed: user.isEmailConfirmed,
          createdAt: user.createdAt,
        }),
      });
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailConfirmed: user.isEmailConfirmed,
      createdAt: user.createdAt,
    });
  }

  private async generateTokens(
    userId: string,
    email: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get("JWT_SECRET"),
        expiresIn: this.configService.get("JWT_EXPIRATION"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get("JWT_REFRESH_SECRET"),
        expiresIn: this.configService.get("JWT_REFRESH_EXPIRATION"),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }
}
