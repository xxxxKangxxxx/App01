import { IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateShoppingListDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  suggestedDate?: string;
}
