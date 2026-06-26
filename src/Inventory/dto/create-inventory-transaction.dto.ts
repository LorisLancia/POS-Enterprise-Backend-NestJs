import { IsString, IsOptional, IsInt } from 'class-validator';
import { StandardUnit } from '@prisma/client';

export class CreateInventoryTransactionDto {
  @IsInt()
  warehouseId: number;

  @IsInt()
  materialId: number;

  @IsString()
  type: string;

  @IsString()
  unit: StandardUnit;

  @IsString()
  quantity: string;

  @IsString()
  @IsOptional()
  unitCost?: string;

  @IsInt()
  @IsOptional()
  referenceId?: number;

  @IsString()
  @IsOptional()
  referenceType?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
