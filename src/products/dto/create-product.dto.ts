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

class ProductVariantDto {
  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  priceAdjustment?: number;
}

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

class ProductAddonItemDto {
  @IsInt()
  addonProductId: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  quantityValue?: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Type(() => Number)
  price?: number;
}

class ProductAddonDto {
  @IsString()
  name: string;

  @IsInt()
  @IsOptional()
  maxQuantity?: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAddonItemDto)
  @IsOptional()
  items?: ProductAddonItemDto[];
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
  @ValidateNested({ each: true })
  @Type(() => ProductRecipeDto)
  @IsOptional()
  recipes?: ProductRecipeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAddonDto)
  @IsOptional()
  addons?: ProductAddonDto[];

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  modifierGroupIds?: number[];
}
