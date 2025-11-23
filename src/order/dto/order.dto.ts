import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export class OrderItemDto {
  @IsString()
  membershipPlanId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  billingName?: string;

  @IsOptional()
  @IsString()
  billingEmail?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsString()
  billingCity?: string;

  @IsOptional()
  @IsString()
  billingState?: string;

  @IsOptional()
  @IsString()
  billingCountry?: string;

  @IsOptional()
  @IsString()
  billingPostalCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;
}

export class OrderItemResponseDto {
  id: string;
  orderId: string;
  membershipPlanId: string;
  quantity: number;
  price: number;
  subtotal: number;
  membershipPlan: {
    id: string;
    name: string;
    type: string;
    description: string;
  };
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.orderId = data.orderId;
    this.membershipPlanId = data.membershipPlanId;
    this.quantity = data.quantity;
    this.price = data.price;
    this.subtotal = data.subtotal;
    this.membershipPlan = data.membershipPlan;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export class OrderResponseDto {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string | null;
  transactionId: string | null;
  billingName: string | null;
  billingEmail: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingCountry: string | null;
  billingPostalCode: string | null;
  notes: string | null;
  items: OrderItemResponseDto[];
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.orderNumber = data.orderNumber;
    this.userId = data.userId;
    this.status = data.status;
    this.paymentStatus = data.paymentStatus;
    this.subtotal = data.subtotal;
    this.discount = data.discount;
    this.total = data.total;
    this.paymentMethod = data.paymentMethod;
    this.transactionId = data.transactionId;
    this.billingName = data.billingName;
    this.billingEmail = data.billingEmail;
    this.billingAddress = data.billingAddress;
    this.billingCity = data.billingCity;
    this.billingState = data.billingState;
    this.billingCountry = data.billingCountry;
    this.billingPostalCode = data.billingPostalCode;
    this.notes = data.notes;
    this.items =
      data.items?.map((item: any) => new OrderItemResponseDto(item)) || [];
    this.completedAt = data.completedAt;
    this.cancelledAt = data.cancelledAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
