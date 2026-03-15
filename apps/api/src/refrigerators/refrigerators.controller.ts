import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RefrigeratorsService } from './refrigerators.service';
import { CreateRefrigeratorDto } from './dto/create-refrigerator.dto';
import { UpdateRefrigeratorDto } from './dto/update-refrigerator.dto';

@Controller('refrigerators')
@UseGuards(AuthGuard('jwt'))
export class RefrigeratorsController {
  constructor(private readonly refrigeratorsService: RefrigeratorsService) {}

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.refrigeratorsService.findAll(req.user.id);
  }

  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateRefrigeratorDto,
  ) {
    return this.refrigeratorsService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateRefrigeratorDto,
  ) {
    return this.refrigeratorsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.refrigeratorsService.remove(req.user.id, id);
  }
}
