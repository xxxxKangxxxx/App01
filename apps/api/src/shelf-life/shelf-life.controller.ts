import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShelfLifeService } from './shelf-life.service';

@Controller('shelf-life')
@UseGuards(AuthGuard('jwt'))
export class ShelfLifeController {
  constructor(private readonly shelfLifeService: ShelfLifeService) {}

  @Get()
  findAll() {
    return this.shelfLifeService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.shelfLifeService.search(query || '');
  }
}
