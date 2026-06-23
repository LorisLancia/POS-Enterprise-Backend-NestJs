import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
}

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  fullName: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  storeId?: number;
}
