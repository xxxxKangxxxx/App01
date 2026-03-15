import { PartialType } from '@nestjs/mapped-types';
import { CreateRefrigeratorDto } from './create-refrigerator.dto';

export class UpdateRefrigeratorDto extends PartialType(CreateRefrigeratorDto) {}
