import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRefrigeratorDto } from './dto/create-refrigerator.dto';
import { UpdateRefrigeratorDto } from './dto/update-refrigerator.dto';

@Injectable()
export class RefrigeratorsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.refrigerator.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  create(userId: string, dto: CreateRefrigeratorDto) {
    return this.prisma.refrigerator.create({
      data: {
        ...dto,
        type: dto.type ?? 'STANDARD',
        sortOrder: dto.sortOrder ?? 0,
        userId,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateRefrigeratorDto) {
    const refrigerator = await this.prisma.refrigerator.findUnique({ where: { id } });
    if (!refrigerator) throw new NotFoundException('냉장고를 찾을 수 없습니다.');
    if (refrigerator.userId !== userId) throw new ForbiddenException();

    return this.prisma.refrigerator.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const refrigerator = await this.prisma.refrigerator.findUnique({ where: { id } });
    if (!refrigerator) throw new NotFoundException('냉장고를 찾을 수 없습니다.');
    if (refrigerator.userId !== userId) throw new ForbiddenException();

    return this.prisma.refrigerator.delete({ where: { id } });
  }
}
