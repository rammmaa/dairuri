import {
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { BusReportInput } from "@dairuri/shared";

export class CreateBusReportDto implements BusReportInput {
  @IsString()
  @Matches(/^\d{1,2}$/)
  @MaxLength(12)
  routeNumber!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  placeName!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}
