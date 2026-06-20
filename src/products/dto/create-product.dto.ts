import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateVariantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  priceAdjustment: number;
}

class CreateRecipeDto {
  @IsInt()
  materialId: number;

  @IsOptional()
  @IsInt()
  variantId?: number;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  wastagePercent?: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
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
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeDto)
  recipes?: CreateRecipeDto[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  modifierGroupIds?: number[];
}
