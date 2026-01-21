import { Module } from '@nestjs/common';
import { SmsController } from './sms.controller';
import { SendlkApiService } from './services/sendlk-api.service';

@Module({
  controllers: [SmsController],
  providers: [SendlkApiService],
  exports: [SendlkApiService],
})
export class SmsModule {}
