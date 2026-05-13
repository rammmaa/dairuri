import { IsString, MaxLength, MinLength } from "class-validator";
import type { CreateJobPostInput } from "@dairuri/shared";

export class CreateJobPostDto implements CreateJobPostInput {
  @IsString()
  @MinLength(4)
  @MaxLength(80)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  placeName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  payLabel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  scheduleLabel!: string;

  @IsString()
  @MaxLength(600)
  description!: string;
}
