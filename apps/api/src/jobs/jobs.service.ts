import { Injectable } from "@nestjs/common";
import type { CreateJobPostInput, JobListing } from "@dairuri/shared";
import { JobsRepository } from "./jobs.repository";

@Injectable()
export class JobsService {
  constructor(
    private readonly jobsRepository: JobsRepository = new JobsRepository(),
  ) {}

  findAll(): JobListing[] {
    return this.jobsRepository.findAll();
  }

  create(input: CreateJobPostInput): JobListing {
    return this.jobsRepository.create(input);
  }
}
