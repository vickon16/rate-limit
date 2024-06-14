import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() //makes prismaModule available to all modules in our app;
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
