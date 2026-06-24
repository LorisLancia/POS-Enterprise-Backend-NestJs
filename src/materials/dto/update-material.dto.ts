// src/materials/dto/update-material.dto.ts
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  unitId?: number; // <-- CHANGED: era unit string

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  costPerUnit?: number;

  @IsOptional()
  @IsNumber()
  minStock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
