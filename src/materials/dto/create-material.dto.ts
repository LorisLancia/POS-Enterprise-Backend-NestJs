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

class MaterialUnitDto {
  @IsString()
  unit: StandardUnit;

  @IsString()
  quantity: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  isPurchaseUnit?: boolean;

  @IsBoolean()
  @IsOptional()
  isSaleUnit?: boolean;
}

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  minStock?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialUnitDto)
  units: MaterialUnitDto[];
}
