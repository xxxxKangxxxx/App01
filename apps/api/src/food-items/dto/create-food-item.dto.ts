import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Category } from '@freshbox/types';

export class CreateFoodItemDto {
  @IsString()
  name: string;

  @IsEnum([
    'VEGETABLES',
    'FRUITS',
    'MEAT',
    'SEAFOOD',
    'DAIRY',
    'BEVERAGE',
    'CONDIMENT',
    'FROZEN',
    'OTHER',
  ])
  category: Category;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsDateString()
  purchasedAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsString()
  refrigeratorId?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  shelf?: number;

  @IsOptional()
  @IsString()
  depth?: string;

  @IsOptional()
  @IsString()
  colPosition?: string;
}
