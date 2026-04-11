import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class UpdateShoppingListDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  suggestedDate?: string;
}
