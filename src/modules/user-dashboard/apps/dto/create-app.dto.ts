import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateAppDto {
    @ApiProperty({ description: 'App name', example: 'My App' })
    @IsString()
    @IsNotEmpty()
    name: string;


}