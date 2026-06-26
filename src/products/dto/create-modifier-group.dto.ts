import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ModifierOptionDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  priceAdjustment?: string;

  @IsInt()
  @IsOptional()
  materialId?: number;

  @IsString()
  @IsOptional()
  quantityConsumed?: string;
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
