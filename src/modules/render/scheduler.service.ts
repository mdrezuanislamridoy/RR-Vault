import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class SchedulerService {
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    try {
      await axios.get('https://rr-vault.onrender.com/ping');
      console.log('Ping successful');
    } catch (err) {
      console.log('Ping failed ', err);
    }
  }
}
