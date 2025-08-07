// src/trello-board/dto/update-list.dto.ts
import { IsString } from 'class-validator';

export class UpdateListDto {
  @IsString()
  name: string;
}
