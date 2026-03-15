import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GoogleProfile {
  googleId: string;
  email?: string;
  name?: string;
}

@Injectable()
export class GoogleStrategy {
  constructor(private readonly configService: ConfigService) {}

  async getTokenFromCode(code: string): Promise<string> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')!;
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET')!;
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI')!;

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    return response.data.access_token as string;
  }

  async getProfile(accessToken: string): Promise<GoogleProfile> {
    const response = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const data = response.data;

    return {
      googleId: data.id,
      email: data.email,
      name: data.name,
    };
  }
}
