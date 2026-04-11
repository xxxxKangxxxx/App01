import { IsOptional, IsString, IsNumber, IsBoolean, Min } from 'class-validator';

export class UpdateShoppingItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isPurchased?: boolean;
}
