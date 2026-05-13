import { Injectable } from "@nestjs/common";
import type { JobListing } from "@dairuri/shared";
import { seedJobListings } from "./job-seed";

@Injectable()
export class JobsRepository {
  private readonly jobs = seedJobListings;

  findAll(): JobListing[] {
    return this.jobs.map((job) => ({ ...job }));
  }
}
