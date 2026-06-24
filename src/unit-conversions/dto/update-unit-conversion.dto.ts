import { IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateUnitConversionDto {
  @IsOptional()
  @IsNumber()
  factor?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
