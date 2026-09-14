import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString() @IsNotEmpty() name!: string;
}

export class ChangePasswordDto {
  @IsString() @IsNotEmpty() currentPassword!: string;
  @IsString() @MinLength(8) newPassword!: string;
}
