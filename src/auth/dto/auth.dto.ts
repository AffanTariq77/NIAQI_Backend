import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsBoolean,
  IsEnum,
} from "class-validator";

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      "Password must contain uppercase, lowercase, and number/special character",
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

export class SignInDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      "Password must contain uppercase, lowercase, and number/special character",
  })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

export class ConfirmEmailDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  token: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

enum MembershipTypeEnum {
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
  PREMIUM_PLUS = "PREMIUM_PLUS",
}

export class UpdateMembershipDto {
  @IsNotEmpty()
  @IsEnum(MembershipTypeEnum, {
    message:
      "membershipType must be one of the following values: BASIC, PREMIUM, PREMIUM_PLUS",
  })
  membershipType: "BASIC" | "PREMIUM" | "PREMIUM_PLUS";
}
