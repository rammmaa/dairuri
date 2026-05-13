import { Injectable } from "@nestjs/common";
import type { RideListing } from "@dairuri/shared";
import { seedRideListings } from "./ride-seed";

@Injectable()
export class RidesRepository {
  private readonly rides = seedRideListings;

  findAll(): RideListing[] {
    return this.rides.map(cloneRide);
  }

  findById(id: string): RideListing | undefined {
    const ride = this.rides.find((item) => item.id === id);
    return ride ? cloneRide(ride) : undefined;
  }
}

function cloneRide(ride: RideListing): RideListing {
  return {
    ...ride,
    location: { ...ride.location },
  };
}
