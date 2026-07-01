import { Module } from '@nestjs/common';
import { AddonGroupsService } from './addon-groups.service';
import { AddonGroupsController } from './addon-groups.controller';

@Module({
  controllers: [AddonGroupsController],
  providers: [AddonGroupsService],
})
export class AddonGroupsModule {}
