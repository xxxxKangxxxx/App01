import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtPayload } from './strategies/jwt.strategy';
import { AuthTokens } from '@freshbox/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly kakaoStrategy: KakaoStrategy,
    private readonly naverStrategy: NaverStrategy,
    private readonly googleStrategy: GoogleStrategy,
  ) {}

  async loginWithKakao(code: string): Promise<AuthTokens> {
    const accessToken = await this.kakaoStrategy.getTokenFromCode(code);
    const profile = await this.kakaoStrategy.getProfile(accessToken);

    let user = await this.usersService.findByKakaoId(profile.kakaoId);
    if (!user && profile.email) {
      const existing = await this.usersService.findByEmail(profile.email);
      if (existing) {
        user = await this.usersService.linkKakaoId(existing.id, profile.kakaoId);
      }
    }
    if (!user) {
      user = await this.usersService.createWithKakao({
        kakaoId: profile.kakaoId,
        email: profile.email,
        name: profile.name,
      });
    }

    return this.generateTokens(user.id, user.email, user.name);
  }

  async loginWithNaver(code: string, state: string): Promise<AuthTokens> {
    const accessToken = await this.naverStrategy.getTokenFromCode(code, state);
    const profile = await this.naverStrategy.getProfile(accessToken);

    let user = await this.usersService.findByNaverId(profile.naverId);
    if (!user && profile.email) {
      const existing = await this.usersService.findByEmail(profile.email);
      if (existing) {
        user = await this.usersService.linkNaverId(existing.id, profile.naverId);
      }
    }
    if (!user) {
      user = await this.usersService.createWithNaver({
        naverId: profile.naverId,
        email: profile.email,
        name: profile.name,
      });
    }

    return this.generateTokens(user.id, user.email, user.name);
  }

  async loginWithGoogle(code: string): Promise<AuthTokens> {
    const accessToken = await this.googleStrategy.getTokenFromCode(code);
    const profile = await this.googleStrategy.getProfile(accessToken);

    let user = await this.usersService.findByGoogleId(profile.googleId);
    if (!user && profile.email) {
      const existing = await this.usersService.findByEmail(profile.email);
      if (existing) {
        user = await this.usersService.linkGoogleId(existing.id, profile.googleId);
      }
    }
    if (!user) {
      user = await this.usersService.createWithGoogle({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
      });
    }

    return this.generateTokens(user.id, user.email, user.name);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user.id, user.email, user.name);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(
    userId: string,
    email?: string | null,
    name?: string | null,
  ): AuthTokens {
    const payload: JwtPayload = { sub: userId, email, name };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { accessToken, refreshToken };
  }
}
