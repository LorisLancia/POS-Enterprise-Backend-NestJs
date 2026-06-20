import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateModifierOptionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  priceAdjustment?: number;

  @IsOptional()
  @IsInt()
  materialId?: number;

  @IsOptional()
  @IsNumber()
  quantityConsumed?: number;
}

export class CreateModifierGroupDto {
  @IsString()
  name: string;

  @IsString()
  selectionType: string; // 'single' or 'multiple'

  @IsInt()
  minSelect: number;

  @IsInt()
  maxSelect: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModifierOptionDto)
  options?: CreateModifierOptionDto[];
}
