import {
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import type { CreateRidePostInput } from "@dairuri/shared";

export class CreateRidePostDto implements CreateRidePostInput {
  @IsString()
  @MinLength(4)
  @MaxLength(80)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  departureName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  destinationName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  dayLabel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  departureTime!: string;

  @IsInt()
  @Min(1)
  @Max(8)
  seatsTotal!: number;

  @IsString()
  @MaxLength(600)
  description!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}
