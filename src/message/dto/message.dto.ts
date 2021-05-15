import { IsBoolean, IsJSON, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class MessageDto {
    @IsString()
    @IsNotEmpty()
    message_type : string;

    @IsString()
    @IsOptional()
    message_name? : string;

    @IsString()
    @IsOptional()
    channel? : string;

    @IsString()
    @IsOptional()
    transaction_id? :string

    @IsJSON()
    @IsOptional()
    payload? : string;
}

export class UpdateDto {
    @IsBoolean()
    @IsNotEmpty()
    is_success : boolean;

    @IsJSON()
    @IsOptional()
    response? : string;
}