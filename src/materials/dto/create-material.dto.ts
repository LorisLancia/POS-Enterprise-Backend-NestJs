import { IsString, IsOptional, IsNumber, IsInt } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsString()
  unit: string; // 'piece', 'gram', 'milliliter', 'bottle'

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
