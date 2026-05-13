import { Injectable, NotFoundException } from "@nestjs/common";
import type { CreateRidePostInput, RideListing } from "@dairuri/shared";
import { RidesRepository } from "./rides.repository";

type CreateRidePost = CreateRidePostInput & {
  lat: number;
  lng: number;
};

@Injectable()
export class RidesService {
  constructor(
    private readonly ridesRepository: RidesRepository = new RidesRepository(),
  ) {}

  findAll(): RideListing[] {
    return this.ridesRepository.findAll();
  }

  create(input: CreateRidePost): RideListing {
    return this.ridesRepository.create(input);
  }

  findOne(id: string): RideListing {
    const ride = this.ridesRepository.findById(id);

    if (!ride) {
      throw new NotFoundException("Ride listing not found");
    }

    return ride;
  }
}
