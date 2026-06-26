import { IsString, IsInt } from 'class-validator';
import { StandardUnit } from '@prisma/client';

export class CreatePOItemDto {
  @IsInt()
  materialId: number;

  @IsString()
  unit: StandardUnit;

  @IsString()
  quantity: string;

  @IsString()
  unitPrice: string;
}
