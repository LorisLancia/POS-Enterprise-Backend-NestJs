import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PosClientsService } from './pos-clients.service';
import { PosClientsController } from './pos-clients.controller';

@Module({
  imports: [
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        'pos-enterprise-secret-key-change-in-production',
      signOptions: { expiresIn: '3650d' },
    }),
  ],
  providers: [PosClientsService],
  controllers: [PosClientsController],
  exports: [PosClientsService],
})
export class PosClientsModule {}
