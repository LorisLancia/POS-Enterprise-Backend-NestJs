// src/materials/dto/create-material.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsNumber()
  unitId: number; // <-- CHANGED: era unit string

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  costPerUnit?: number;

  @IsOptional()
  @IsNumber()
  minStock?: number;
}
