import { Injectable } from '@nestjs/common';
import { PrismaClient, users } from 'generated/prisma';
import { CreateUserDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';
import { SupabaseService } from 'src/core/supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private supabaseService: SupabaseService,
  ) {}

  async signup(createUserDto: CreateUserDto): Promise<users> {
    // In a real implementation, we would:
    // 1. Check if user already exists
    // 2. Hash the password
    // 3. Create the user record
    // 4. Create the profile record
    // 5. Return the user without sensitive data

    const user = await this.prisma.users.create({
      data: {
        email: createUserDto.email,
        encrypted_password: createUserDto.password, // NOTE: In production, hash this password
        profiles: {
          create: {
            full_name: `${createUserDto.firstName} ${createUserDto.lastName}`,
            username: `${createUserDto.email}`,
          },
        },
      },
    });

    return user;
  }

  async login(loginDto: LoginDto): Promise<users | null> {
    console.log(
      `🛠 LOG: 🚀 --> ----------------------------------------------------------🛠 LOG: 🚀 -->`,
    );
    console.log(`🛠 LOG: 🚀 --> ~ AuthService ~ login ~ loginDto:`, loginDto);
    console.log(
      `🛠 LOG: 🚀 --> ----------------------------------------------------------🛠 LOG: 🚀 -->`,
    );
    // In a real implementation with Supabase:
    // 1. We would use Supabase auth client to authenticate
    // 2. Validate credentials
    // 3. Return user data
    try {
      // Use Supabase's built-in auth mechanism
      const { data, error } = await this.supabaseService.signIn(
        loginDto.email,
        loginDto.password,
      );

      if (error) {
        console.error('Login error:', error.message);
        return null;
      }

      if (!data.user) {
        return null;
      }

      // Fetch the complete user profile from your database
      const user = await this.prisma.users.findUnique({
        where: { id: data.user.id },
      });

      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  async findUserById(id: string): Promise<users | null> {
    return this.prisma.users.findUnique({
      where: { id },
      include: {
        profiles: true,
      },
    });
  }
}
