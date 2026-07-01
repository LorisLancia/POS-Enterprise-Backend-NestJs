import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

class UpdateModifierOptionDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  priceAdjustment?: number;

  @IsNumber()
  @IsOptional()
  materialId?: number;

  @IsNumber()
  @IsOptional()
  quantityConsumed?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}

export class UpdateModifierGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  selectionType?: string;

  @IsNumber()
  @IsOptional()
  minSelect?: number;

  @IsNumber()
  @IsOptional()
  maxSelect?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  options?: UpdateModifierOptionDto[];
}
