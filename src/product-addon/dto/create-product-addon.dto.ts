import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductAddonItemDto {
  @IsNumber()
  addonProductId: number;

  @IsOptional()
  @IsNumber()
  quantityValue?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateProductAddonDto {
  @IsNumber()
  productId: number;

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
  @Type(() => CreateProductAddonItemDto)
  items: CreateProductAddonItemDto[];
}

export class CreateProductAddonInlineDto {
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
  @Type(() => CreateProductAddonItemDto)
  items: CreateProductAddonItemDto[];
}
