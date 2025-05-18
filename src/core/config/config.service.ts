import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get nodeEnv(): string | undefined {
    return this.configService.get<string>('NODE_ENV');
  }

  get port(): number | undefined {
    return this.configService.get<number>('PORT');
  }

  get supabaseUrl(): string | undefined {
    return this.configService.get<string>('SUPABASE_URL');
  }

  get supabaseKey(): string | undefined {
    return this.configService.get<string>('SUPABASE_KEY');
  }

  get supabaseJwtSecret(): string | undefined {
    return this.configService.get<string>('SUPABASE_JWT_SECRET');
  }

  get databaseUrl(): string | undefined {
    console.log(
      `🛠 LOG: 🚀 --> ---------------------------------------------------------------------------------------------------------------------------------------🛠 LOG: 🚀 -->`,
    );
    console.log(
      "🛠 LOG: 🚀 --> ~ ConfigService ~ getdatabaseUrl ~ configService.get<string>('DATABASE_URL'):",
      this.configService.get<string>('DATABASE_URL'),
    );
    console.log(
      `🛠 LOG: 🚀 --> ---------------------------------------------------------------------------------------------------------------------------------------🛠 LOG: 🚀 -->`,
    );
    return this.configService.get<string>('DATABASE_URL');
  }
}
