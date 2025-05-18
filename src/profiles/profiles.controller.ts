/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, Param } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a profile by user ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async getProfile(@Param('id') id: string) {
    return await this.profilesService.findByUserId(id);
  }
}
