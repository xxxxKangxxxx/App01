import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min } from 'class-validator';
import { Category } from '@freshbox/types';

export class AddShoppingItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(['VEGETABLES', 'FRUITS', 'MEAT', 'SEAFOOD', 'DAIRY', 'BEVERAGE', 'CONDIMENT', 'FROZEN', 'OTHER'])
  category?: Category;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
