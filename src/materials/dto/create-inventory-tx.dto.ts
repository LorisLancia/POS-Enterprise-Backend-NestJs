import { IsInt, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateInventoryTransactionDto {
  @IsInt()
  warehouseId: number;

  @IsInt()
  materialId: number;

  @IsString()
  type:
    | 'purchase'
    | 'sale'
    | 'transfer_in'
    | 'transfer_out'
    | 'adjustment'
    | 'waste'
    | 'return';

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsInt()
  referenceId?: number;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
