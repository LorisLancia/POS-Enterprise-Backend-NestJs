import { IsInt, IsNotEmpty, IsNumber, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiveItemDto {
  @IsInt()
  @IsNotEmpty()
  poItemId: number;

  @IsNumber()
  @IsNotEmpty()
  receivedQty: number;

  @IsNumber()
  @IsNotEmpty()
  unitCost: number;
}

export class ReceivePurchaseOrderDto {
  @IsInt()
  @IsNotEmpty()
  receivedBy: number;

  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  @ArrayMinSize(1)
  items: ReceiveItemDto[];
}
