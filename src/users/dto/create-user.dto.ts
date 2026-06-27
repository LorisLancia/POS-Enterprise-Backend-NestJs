import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsString()
  fullName: string;

  @IsNumber()
  roleId: number;

  @IsNumber()
  companyId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
