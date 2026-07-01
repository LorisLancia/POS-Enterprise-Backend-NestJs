import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class AddonGroupItemDto {
  @IsInt()
  addonProductId: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  quantityValue?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateAddonGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  maxQuantity?: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddonGroupItemDto)
  @IsOptional()
  items?: AddonGroupItemDto[];
}
