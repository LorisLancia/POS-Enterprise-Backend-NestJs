import { IsString, IsOptional } from 'class-validator';

export class UpdatePurchaseOrderDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
