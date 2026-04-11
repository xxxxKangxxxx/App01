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
import { ShoppingService } from './shopping.service';
import { ShoppingRecommendationService } from './shopping-recommendation.service';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { AddShoppingItemDto } from './dto/add-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { PurchaseAndAddDto } from './dto/purchase-and-add.dto';

@Controller('shopping')
@UseGuards(AuthGuard('jwt'))
export class ShoppingController {
  constructor(
    private readonly shoppingService: ShoppingService,
    private readonly recommendationService: ShoppingRecommendationService,
  ) {}

  // ── 추천 ──

  @Get('recommendations')
  getRecommendations(@Request() req: { user: { id: string } }) {
    return this.recommendationService.getRecommendations(req.user.id);
  }

  // ── ShoppingList CRUD ──

  @Get('lists')
  findAllLists(
    @Request() req: { user: { id: string } },
    @Query('isCompleted') isCompleted?: string,
  ) {
    const completed =
      isCompleted === 'true' ? true : isCompleted === 'false' ? false : undefined;
    return this.shoppingService.findAllLists(req.user.id, completed);
  }

  @Post('lists')
  createList(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateShoppingListDto,
  ) {
    return this.shoppingService.createList(req.user.id, dto);
  }

  @Post('lists/from-recommendations')
  createListFromRecommendations(@Request() req: { user: { id: string } }) {
    return this.shoppingService.createListFromRecommendations(req.user.id);
  }

  @Get('lists/:id')
  findOneList(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.shoppingService.findOneList(req.user.id, id);
  }

  @Patch('lists/:id')
  updateList(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateShoppingListDto,
  ) {
    return this.shoppingService.updateList(req.user.id, id, dto);
  }

  @Delete('lists/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeList(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.shoppingService.removeList(req.user.id, id);
  }

  // ── ShoppingItem CRUD ──

  @Post('lists/:listId/items')
  addItem(
    @Param('listId') listId: string,
    @Request() req: { user: { id: string } },
    @Body() dto: AddShoppingItemDto,
  ) {
    return this.shoppingService.addItem(req.user.id, listId, dto);
  }

  @Patch('lists/:listId/items/:itemId')
  updateItem(
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateShoppingItemDto,
  ) {
    return this.shoppingService.updateItem(req.user.id, listId, itemId, dto);
  }

  @Delete('lists/:listId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeItem(
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.shoppingService.removeItem(req.user.id, listId, itemId);
  }

  // ── 구매 완료 + 냉장고 추가 ──

  @Post('lists/:listId/items/:itemId/purchase')
  purchaseAndAdd(
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
    @Request() req: { user: { id: string } },
    @Body() dto: PurchaseAndAddDto,
  ) {
    return this.shoppingService.purchaseAndAdd(
      req.user.id,
      listId,
      itemId,
      dto,
    );
  }
}
