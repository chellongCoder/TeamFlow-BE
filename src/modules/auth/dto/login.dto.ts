import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'chellong98.act@gmail.com',
    description: 'User email address',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Chellong17798@',
    description: 'User password',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
