import { IsInt, IsNumber } from 'class-validator';

export class OpenShiftDto {
  @IsInt()
  posClientId: number;

  @IsNumber()
  startingCash: number;
}
