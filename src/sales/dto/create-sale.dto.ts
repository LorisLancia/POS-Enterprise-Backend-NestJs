import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class SaleItemModifierDto {
  @IsInt()
  modifierOptionId: number;

  @IsOptional()
  @IsInt()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  priceAdjustment?: number;
}

class SaleItemDto {
  @IsInt()
  productId: number;

  @IsOptional()
  @IsInt()
  variantId?: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemModifierDto)
  modifiers?: SaleItemModifierDto[];
}

class PaymentDto {
  @IsString()
  method: string; // 'cash', 'card', 'qr', 'transfer', 'voucher'

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class CreateSaleDto {
  @IsInt()
  warehouseId: number;

  @IsInt()
  posClientId: number;

  @IsInt()
  shiftId: number;

  @IsOptional()
  @IsNumber()
  discountTotal?: number;

  @IsOptional()
  @IsInt()
  customerCount?: number;

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[];
}
