import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTransferDto {
  @IsInt()
  fromWarehouseId: number;

  @IsInt()
  toWarehouseId: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
