import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateInventoryTransactionDto {
  @IsInt()
  materialId: number;

  @IsString()
  unit: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
