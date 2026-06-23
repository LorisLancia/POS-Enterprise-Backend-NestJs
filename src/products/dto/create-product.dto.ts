import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProductVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  priceAdjustment?: number;
}

class ProductRecipeDto {
  @IsNumber()
  materialId: number;

  @IsOptional()
  @IsNumber()
  variantId?: number;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  wastagePercent?: number;
}

class ProductAddonItemDto {
  @IsNumber()
  addonProductId: number;

  @IsOptional()
  @IsNumber()
  quantityValue?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

class ProductAddonInlineDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  maxQuantity?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAddonItemDto)
  items: ProductAddonItemDto[];
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  basePrice: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @IsOptional()
  @IsBoolean()
  allowDecimalQty?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductRecipeDto)
  recipes?: ProductRecipeDto[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  modifierGroupIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAddonInlineDto)
  addons?: ProductAddonInlineDto[];
}
