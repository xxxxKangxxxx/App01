import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface NaverProfile {
  naverId: string;
  email?: string;
  name?: string;
}

@Injectable()
export class NaverStrategy {
  constructor(private readonly configService: ConfigService) {}

  async getTokenFromCode(code: string, state: string): Promise<string> {
    const clientId = this.configService.get<string>('NAVER_CLIENT_ID')!;
    const clientSecret = this.configService.get<string>('NAVER_CLIENT_SECRET')!;
    const redirectUri = this.configService.get<string>('NAVER_REDIRECT_URI')!;

    const response = await axios.get('https://nid.naver.com/oauth2.0/token', {
      params: {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        state,
      },
    });

    return response.data.access_token as string;
  }

  async getProfile(accessToken: string): Promise<NaverProfile> {
    const response = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = response.data.response;

    return {
      naverId: profile.id,
      email: profile.email,
      name: profile.name,
    };
  }
}
