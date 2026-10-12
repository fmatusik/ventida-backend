import { IsString, MaxLength } from 'class-validator';

/** Zmienić można tylko wartość - przenoszenie na inne ogłoszenie/atrybut jest zablokowane. */
export class UpdateAttributeValueDto {
  @IsString() @MaxLength(200)
  value: string;
}
