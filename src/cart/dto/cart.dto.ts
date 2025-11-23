import { IsString, IsNumber, IsOptional, Min } from "class-validator";

export class AddToCartDto {
  @IsString()
  membershipPlanId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CartItemResponseDto {
  id: string;
  cartId: string;
  membershipPlanId: string;
  quantity: number;
  price: number;
  membershipPlan: {
    id: string;
    name: string;
    type: string;
    currentPrice: number;
    oldPrice: number | null;
    description: string;
  };
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.cartId = data.cartId;
    this.membershipPlanId = data.membershipPlanId;
    this.quantity = data.quantity;
    this.price = data.price;
    this.membershipPlan = data.membershipPlan;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export class CartResponseDto {
  id: string;
  userId: string;
  items: CartItemResponseDto[];
  subtotal: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.userId = data.userId;
    this.items =
      data.items?.map((item: any) => new CartItemResponseDto(item)) || [];
    this.subtotal = this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
