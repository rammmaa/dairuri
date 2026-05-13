import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateRidePostDto } from "./ride-post.dto";
import { RidesService } from "./rides.service";

@Controller("rides")
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Get()
  findAll() {
    return this.ridesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateRidePostDto) {
    return this.ridesService.create(dto);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ridesService.findOne(id);
  }
}
