import { Module } from "@nestjs/common";
import { RidesController } from "./rides.controller";
import { RidesRepository } from "./rides.repository";
import { RidesService } from "./rides.service";

@Module({
  controllers: [RidesController],
  providers: [RidesRepository, RidesService],
  exports: [RidesService],
})
export class RidesModule {}
