import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StandardUnit } from '@prisma/client';

class ProductVariantDto {
  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  priceAdjustment?: string;
}

class ProductRecipeDto {
  @IsInt()
  materialId: number;

  @IsString()
  quantity: string;

  @IsString()
  unit: StandardUnit;

  @IsString()
  @IsOptional()
  wastagePercent?: string;
}

class ProductAddonItemDto {
  @IsInt()
  addonProductId: number;

  @IsString()
  @IsOptional()
  quantityValue?: string;

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

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsString()
  basePrice: string;

  @IsString()
  @IsOptional()
  taxRate?: string;

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
