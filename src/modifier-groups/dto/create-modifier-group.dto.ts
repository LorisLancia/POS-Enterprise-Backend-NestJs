import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

enum StandardUnit {
  ML = 'ML',
  L = 'L',
  G = 'G',
  KG = 'KG',
  PC = 'PC',
  PK = 'PK',
}

class ModifierOptionDto {
  @IsString()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Type(() => Number)
  priceAdjustment?: number;

  @IsInt()
  @IsOptional()
  materialId?: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Type(() => Number)
  quantityConsumed?: number;

  @IsEnum(StandardUnit)
  @IsOptional()
  unit?: StandardUnit;
}

export class CreateModifierGroupDto {
  @IsString()
  name: string;

  @IsString()
  selectionType: string;

  @IsInt()
  minSelect: number;

  @IsInt()
  maxSelect: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModifierOptionDto)
  @IsOptional()
  options?: ModifierOptionDto[];
}
