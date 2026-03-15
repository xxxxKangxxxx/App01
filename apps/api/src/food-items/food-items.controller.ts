import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FoodItemsService } from './food-items.service';
import { CreateFoodItemDto } from './dto/create-food-item.dto';
import { UpdateFoodItemDto } from './dto/update-food-item.dto';
import { Category } from '@freshbox/types';

@Controller('food-items')
@UseGuards(AuthGuard('jwt'))
export class FoodItemsController {
  constructor(private readonly foodItemsService: FoodItemsService) {}

  @Get()
  findAll(
    @Request() req: { user: { id: string } },
    @Query('category') category?: Category,
    @Query('location') location?: string,
    @Query('expiringSoon') expiringSoon?: string,
    @Query('isConsumed') isConsumed?: string,
  ) {
    return this.foodItemsService.findAll(req.user.id, {
      category,
      location,
      expiringSoon: expiringSoon === 'true',
      isConsumed: isConsumed === 'true' ? true : isConsumed === 'false' ? false : undefined,
    });
  }

  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateFoodItemDto,
  ) {
    return this.foodItemsService.create(req.user.id, dto);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.foodItemsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateFoodItemDto,
  ) {
    return this.foodItemsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.foodItemsService.remove(id, req.user.id);
  }
}
