import { IsInt, IsOptional, IsBoolean } from 'class-validator';

export class AssignModifierDto {
  @IsInt()
  productId: number;

  @IsInt()
  groupId: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
