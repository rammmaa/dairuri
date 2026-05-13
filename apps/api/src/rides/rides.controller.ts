import { Controller, Get, Param } from "@nestjs/common";
import { RidesService } from "./rides.service";

@Controller("rides")
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Get()
  findAll() {
    return this.ridesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ridesService.findOne(id);
  }
}
