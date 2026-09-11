import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTechnicalNoteDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsNotEmpty() content!: string;
  @IsOptional() @IsString() measurements?: string;
}
