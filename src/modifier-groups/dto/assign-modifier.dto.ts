import { IsInt, IsBoolean, IsOptional } from 'class-validator';

export class AssignModifierDto {
  @IsInt()
  productId: number;

  @IsInt()
  groupId: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}
