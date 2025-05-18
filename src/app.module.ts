import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfilesModule } from './profiles/profiles.module';
import { SupabaseModule } from './core/supabase/supabase.module';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from './core/config/config.module';

@Module({
  imports: [ProfilesModule, SupabaseModule, AuthModule, ConfigModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
  ],
})
export class AppModule {}
