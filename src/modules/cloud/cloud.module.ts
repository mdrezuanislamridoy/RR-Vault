import { Module } from '@nestjs/common';
import { CloudController } from './cloud.controller';
import { CloudService } from './cloud.service';
import { PrismaModule } from '@/lib/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CloudController],
  providers: [CloudService],
})
export class CloudModule {}
