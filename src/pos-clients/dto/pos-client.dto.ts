import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreatePosClientDto {
  @IsInt()
  companyId: number;

  @IsInt()
  warehouseId: number;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  hardwareId?: string;
}

export class UpdatePosClientDto {
  @IsInt()
  @IsOptional()
  warehouseId?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  hardwareId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
