import { IsInt, IsNotEmpty, IsNumber, IsString, IsOptional, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class StartingBalanceItemDto {
  @IsInt()
  @IsNotEmpty()
  materialId: number;

  @IsInt()
  @IsNotEmpty()
  unitId: number; // FK su Unit (non StandardUnit) per flessibilità

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  unitCost: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateStartingBalanceDto {
  @IsInt()
  @IsNotEmpty()
  warehouseId: number;

  @IsInt()
  @IsNotEmpty()
  createdBy: number;

  @ValidateNested({ each: true })
  @Type(() => StartingBalanceItemDto)
  @ArrayMinSize(1)
  items: StartingBalanceItemDto[];
}
