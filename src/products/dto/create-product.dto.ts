import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StandardUnit } from '@prisma/client';

class ProductRecipeDto {
  @IsInt()
  materialId: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  quantity: number;

  @IsString()
  unit: StandardUnit;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  wastagePercent?: number;
}

class ProductVariantDto {
  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  priceAdjustment?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductRecipeDto)
  @IsOptional()
  recipes?: ProductRecipeDto[];
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  basePrice: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  taxRate?: number;

  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @IsBoolean()
  @IsOptional()
  allowDecimalQty?: boolean;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[];

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  modifierGroupIds?: number[];

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  addonGroupIds?: number[];
}
