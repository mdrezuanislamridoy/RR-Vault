import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRoles } from '@prisma';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Updated name for the user', type: String, example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated role for the user', enum: UserRoles, example: UserRoles.ADMIN })
  @IsOptional()
  @IsEnum(UserRoles)
  role?: UserRoles;
}
