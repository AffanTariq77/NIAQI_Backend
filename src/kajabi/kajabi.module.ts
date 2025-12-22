import { Module } from '@nestjs/common';
import { KajabiService } from './kajabi.service';
import { KajabiController } from './kajabi.controller';

@Module({
  providers: [KajabiService],
  controllers: [KajabiController],
  exports: [KajabiService],
})
export class KajabiModule {}
