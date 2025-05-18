import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ConfigService } from './config.service';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        SUPABASE_URL: Joi.string().required(),
        SUPABASE_KEY: Joi.string().required(),
        SUPABASE_JWT_SECRET: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
      }),
      envFilePath: ['.env'],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
