import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByKakaoId(kakaoId: string) {
    return this.prisma.user.findUnique({ where: { kakaoId } });
  }

  async findByNaverId(naverId: string) {
    return this.prisma.user.findUnique({ where: { naverId } });
  }

  async findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createWithKakao(data: { kakaoId: string; email?: string; name?: string }) {
    return this.prisma.user.create({ data });
  }

  async createWithNaver(data: { naverId: string; email?: string; name?: string }) {
    return this.prisma.user.create({ data });
  }

  async createWithGoogle(data: { googleId: string; email?: string; name?: string }) {
    return this.prisma.user.create({ data });
  }

  async updatePushToken(userId: string, pushToken: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushToken },
    });
  }

  async findAllWithPushTokens() {
    return this.prisma.user.findMany({
      where: { pushToken: { not: null } },
      select: { id: true, pushToken: true },
    });
  }
}
