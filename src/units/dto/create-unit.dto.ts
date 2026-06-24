import { IsString, IsOptional } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  name: string;

  @IsString()
  symbol: string;

  @IsOptional()
  @IsString()
  type?: string;
}
