import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Redirect,
  UseGuards,
  Request,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  // 카카오 로그인 URL로 리다이렉트
  @Get('kakao')
  @Redirect()
  kakaoLogin() {
    const clientId = this.configService.get<string>('KAKAO_CLIENT_ID');
    const redirectUri = this.configService.get<string>('KAKAO_REDIRECT_URI');
    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    return { url };
  }

  // 카카오 콜백
  @Get('kakao/callback')
  @Redirect()
  async kakaoCallback(@Query('code') code: string) {
    const tokens = await this.authService.loginWithKakao(code);
    const deepLink = this.configService.get<string>('MOBILE_DEEP_LINK', 'freshbox://');
    return {
      url: `${deepLink}auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
      statusCode: 302,
    };
  }

  // 네이버 로그인 URL로 리다이렉트
  @Get('naver')
  @Redirect()
  naverLogin() {
    const clientId = this.configService.get<string>('NAVER_CLIENT_ID');
    const redirectUri = this.configService.get<string>('NAVER_REDIRECT_URI');
    const state = Math.random().toString(36).substring(7);
    const url = `https://nid.naver.com/oauth2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
    return { url };
  }

  // 네이버 콜백
  @Get('naver/callback')
  @Redirect()
  async naverCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    const tokens = await this.authService.loginWithNaver(code, state);
    const deepLink = this.configService.get<string>('MOBILE_DEEP_LINK', 'freshbox://');
    return {
      url: `${deepLink}auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
      statusCode: 302,
    };
  }

  // 구글 로그인 URL로 리다이렉트
  @Get('google')
  @Redirect()
  googleLogin() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
    const scope = encodeURIComponent('email profile');
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    return { url };
  }

  // 구글 콜백
  @Get('google/callback')
  @Redirect()
  async googleCallback(@Query('code') code: string) {
    const tokens = await this.authService.loginWithGoogle(code);
    const deepLink = this.configService.get<string>('MOBILE_DEEP_LINK', 'freshbox://');
    return {
      url: `${deepLink}auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
      statusCode: 302,
    };
  }

  // JWT 리프레시
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  // 로그아웃 (클라이언트에서 토큰 삭제 처리, 서버는 pushToken 초기화)
  @Delete('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req: { user: { id: string } }) {
    await this.usersService.updatePushToken(req.user.id, '');
  }

  // 내 프로필
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Request() req: { user: { id: string; email?: string; name?: string } }) {
    return req.user;
  }

  // 푸시 토큰 업데이트
  @Post('push-token')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async updatePushToken(
    @Request() req: { user: { id: string } },
    @Body('pushToken') pushToken: string,
  ) {
    await this.usersService.updatePushToken(req.user.id, pushToken);
    return { success: true };
  }
}
