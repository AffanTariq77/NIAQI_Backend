import { Controller, Get } from '@nestjs/common';
import { KajabiService } from './kajabi.service';

@Controller('kajabi')
export class KajabiController {
  constructor(private readonly kajabiService: KajabiService) {}

  @Get('courses')
  async getCourses(): Promise<any[]> {
    return this.kajabiService.getCourses();
  }
}
