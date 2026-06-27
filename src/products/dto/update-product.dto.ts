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
  @IsInt()
  @IsOptional()
  id?: number; // ← per l'upsert in edit

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

class ProductAddonItemDto {
  @IsInt()
  addonProductId: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  quantityValue?: number;

  @IsNumber({ maxDecimalPlaces: 2 }) // ← AGGIUNGI
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
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

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  basePrice?: number;

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
  @Type(() => ProductAddonDto)
  @IsOptional()
  addons?: ProductAddonDto[];

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  modifierGroupIds?: number[];
}
