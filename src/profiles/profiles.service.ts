import { PrismaClient } from 'generated/prisma';
import { Injectable } from '@nestjs/common';
const prisma = new PrismaClient();

@Injectable()
export class ProfilesService {
  async findByUserId(userId: string) {
    return await prisma.profiles.findUnique({ where: { id: userId } });
  }
}
