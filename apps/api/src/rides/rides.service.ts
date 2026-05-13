import { Injectable, NotFoundException } from "@nestjs/common";
import type { RideListing } from "@dairuri/shared";
import { RidesRepository } from "./rides.repository";

@Injectable()
export class RidesService {
  constructor(
    private readonly ridesRepository: RidesRepository = new RidesRepository(),
  ) {}

  findAll(): RideListing[] {
    return this.ridesRepository.findAll();
  }

  findOne(id: string): RideListing {
    const ride = this.ridesRepository.findById(id);

    if (!ride) {
      throw new NotFoundException("Ride listing not found");
    }

    return ride;
  }
}
