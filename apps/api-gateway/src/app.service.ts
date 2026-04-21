import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway'
    };
  }
}
