import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin User Management')
@ApiBearerAuth()
@Controller('admin-dashboard/user-management')
@UseGuards(AuthGuard)
@Roles('ADMIN')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) { }

  @Get()
  @ApiOperation({ summary: 'Get Users List', description: 'Fetch all users with pagination and filters. Role: ADMIN' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers(@Query() query: GetUsersDto) {
    return this.userManagementService.getUsers(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update User Details', description: 'Change user properties like name or role. Role: ADMIN' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
  ) {
    return this.userManagementService.updateUser(id, updateData);
  }

  @Patch(':id/update-block-status')
  @ApiOperation({ summary: 'Update Block Status', description: 'Toggle blocked/unblocked state. Role: ADMIN' })
  @ApiResponse({ status: 200, description: 'Block status updated' })
  async updateBlockStatus(@Param('id') id: string) {
    return this.userManagementService.updateBlockStatus(id);
  }
}
