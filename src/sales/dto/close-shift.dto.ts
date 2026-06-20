import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CloseShiftDto {
  @IsNumber()
  actualCash: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
