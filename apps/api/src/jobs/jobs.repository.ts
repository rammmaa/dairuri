import { Injectable } from "@nestjs/common";
import type { CreateJobPostInput, JobListing } from "@dairuri/shared";
import { seedJobListings } from "./job-seed";

@Injectable()
export class JobsRepository {
  private nextId = seedJobListings.length + 1;
  private readonly jobs = [...seedJobListings];

  findAll(): JobListing[] {
    return this.jobs.map((job) => ({ ...job }));
  }

  create(input: CreateJobPostInput): JobListing {
    const job: JobListing = {
      id: `job-created-${this.nextId}`,
      type: "job",
      title: input.title,
      placeName: input.placeName,
      payLabel: input.payLabel,
      scheduleLabel: input.scheduleLabel,
    };

    this.nextId += 1;
    this.jobs.unshift(job);

    return { ...job };
  }
}
