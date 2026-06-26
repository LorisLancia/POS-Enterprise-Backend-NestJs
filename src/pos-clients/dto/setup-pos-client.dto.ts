import { IsString, IsInt, IsOptional } from 'class-validator';

export class SetupPosClientDto {
  @IsString()
  adminUsername: string;

  @IsString()
  adminPin: string;

  @IsInt()
  companyId: number;

  @IsInt()
  warehouseId: number;

  @IsString()
  registerName: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  hardwareId: string;
}
