import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './app-config.service.js';
import { envSchema } from './env.schema.js';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      cache: true,
      validationSchema: envSchema,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
