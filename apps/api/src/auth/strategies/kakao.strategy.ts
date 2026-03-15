import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface KakaoProfile {
  kakaoId: string;
  email?: string;
  name?: string;
}

@Injectable()
export class KakaoStrategy {
  constructor(private readonly configService: ConfigService) {}

  async getTokenFromCode(code: string): Promise<string> {
    const clientId = this.configService.get<string>('KAKAO_CLIENT_ID')!;
    const redirectUri = this.configService.get<string>('KAKAO_REDIRECT_URI')!;

    const response = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return response.data.access_token as string;
  }

  async getProfile(accessToken: string): Promise<KakaoProfile> {
    const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = response.data;
    const account = data.kakao_account ?? {};

    return {
      kakaoId: String(data.id),
      email: account.email,
      name: account.profile?.nickname,
    };
  }
}
