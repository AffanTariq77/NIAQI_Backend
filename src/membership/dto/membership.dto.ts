import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
} from "class-validator";
import { MembershipType } from "@prisma/client";

export class MembershipPlanResponseDto {
  id: string;
  name: string;
  type: MembershipType;
  description: string;
  features: string[];
  currentPrice: number;
  oldPrice: number | null;
  durationMonths: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.description = data.description;
    this.features = data.features || [];
    this.currentPrice = data.currentPrice;
    this.oldPrice = data.oldPrice;
    this.durationMonths = data.durationMonths;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export class CreateMembershipPlanDto {
  @IsString()
  name: string;

  @IsEnum(MembershipType)
  type: MembershipType;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsNumber()
  currentPrice: number;

  @IsOptional()
  @IsNumber()
  oldPrice?: number;

  @IsOptional()
  @IsNumber()
  durationMonths?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMembershipPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsNumber()
  currentPrice?: number;

  @IsOptional()
  @IsNumber()
  oldPrice?: number;

  @IsOptional()
  @IsNumber()
  durationMonths?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
