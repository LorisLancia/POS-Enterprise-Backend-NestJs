import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
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

export class CreateAddonGroupDto {
  @IsString()
  name: string;

  @IsInt()
  @IsOptional()
  maxQuantity?: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddonGroupItemDto)
  @IsOptional()
  items?: AddonGroupItemDto[];
}
