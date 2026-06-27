import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductAddonItemDto {
  @IsNumber()
  addonProductId: number;

  @IsOptional()
  @IsNumber()
  quantityValue?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateProductAddonDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  maxQuantity?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductAddonItemDto)
  items?: UpdateProductAddonItemDto[];
}
