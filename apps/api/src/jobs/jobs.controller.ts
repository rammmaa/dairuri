import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateJobPostDto } from "./job-post.dto";
import { JobsService } from "./jobs.service";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  findAll() {
    return this.jobsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateJobPostDto) {
    return this.jobsService.create(dto);
  }
}
