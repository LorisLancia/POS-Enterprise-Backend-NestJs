import { IsInt, IsNotEmpty, IsString, IsOptional, IsNumber, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class POItemDto {
  @IsInt()
  @IsNotEmpty()
  materialId: number;

  @IsInt()
  @IsNotEmpty()
  unitId: number; // FK su MaterialUnit per avere la StandardUnit

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @IsInt()
  @IsNotEmpty()
  warehouseId: number;

  @IsInt()
  @IsNotEmpty()
  supplierId: number;

  @IsInt()
  @IsNotEmpty()
  createdBy: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @ValidateNested({ each: true })
  @Type(() => POItemDto)
  @ArrayMinSize(1)
  items: POItemDto[];
}
