import { IsNumber } from 'class-validator';

export class CreateUnitConversionDto {
  @IsNumber()
  fromUnitId: number;

  @IsNumber()
  toUnitId: number;

  @IsNumber()
  factor: number;
}
