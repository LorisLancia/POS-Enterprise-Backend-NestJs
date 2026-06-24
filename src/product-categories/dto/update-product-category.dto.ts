// src/product-categories/dto/update-product-category.dto.ts
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class UpdateProductCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
