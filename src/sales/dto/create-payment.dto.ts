import { IsString, IsNumber, IsOptional, IsInt } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  saleId: number;

  @IsString()
  method: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  reference?: string;
}
