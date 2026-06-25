import { IsString, IsInt, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  pin: string;

  @IsInt()
  @IsOptional()
  companyId?: number;
}
