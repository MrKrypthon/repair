import { Body, Controller, Delete, Get, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { assertAllowedMimeType, IMAGE_MIME_TYPES } from '../common/file-validation';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-profile.dto';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: { user: { sub: string } }) {
    return this.authService.findUser(request.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() request: { user: { sub: string } }, @Body() body: UpdateProfileDto) {
    return this.authService.updateProfile(request.user.sub, body.name);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() request: { user: { sub: string } }, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(request.user.sub, body.currentPassword, body.newPassword);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_AVATAR_SIZE } }))
  uploadAvatar(@Req() request: { user: { sub: string } }, @UploadedFile() file: Express.Multer.File) {
    assertAllowedMimeType(file, IMAGE_MIME_TYPES, 'Solo se permiten imágenes JPG, PNG o WEBP');
    return this.authService.uploadAvatar(request.user.sub, file);
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  removeAvatar(@Req() request: { user: { sub: string } }) {
    return this.authService.removeAvatar(request.user.sub);
  }

  @Get('technicians')
  @UseGuards(JwtAuthGuard)
  technicians() {
    return this.authService.listTechnicians();
  }
}
