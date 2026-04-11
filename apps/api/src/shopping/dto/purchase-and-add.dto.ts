import { IsOptional, IsString, IsInt, IsDateString } from 'class-validator';

export class PurchaseAndAddDto {
  @IsOptional()
  @IsString()
  refrigeratorId?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsInt()
  shelf?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
