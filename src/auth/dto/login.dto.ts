import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  pin: string;

  @IsInt()
  storeId: number;
}
