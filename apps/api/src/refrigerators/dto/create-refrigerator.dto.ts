import { IsString, IsEnum, IsOptional, IsInt, Min, IsArray } from 'class-validator';
import { RefrigeratorType } from '@freshbox/types';

export class CreateRefrigeratorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(['STANDARD', 'SIDE_BY_SIDE', 'FRENCH_DOOR', 'FREEZER', 'KIMCHI'])
  type?: RefrigeratorType;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  customZones?: any[];
}
