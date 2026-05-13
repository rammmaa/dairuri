import { Injectable } from "@nestjs/common";
import type { CreateRidePostInput, RideListing } from "@dairuri/shared";
import { seedRideListings } from "./ride-seed";

type CreateRidePostRecord = CreateRidePostInput & {
  lat: number;
  lng: number;
};

@Injectable()
export class RidesRepository {
  private nextId = seedRideListings.length + 1;
  private readonly rides = [...seedRideListings];

  findAll(): RideListing[] {
    return this.rides.map(cloneRide);
  }

  findById(id: string): RideListing | undefined {
    const ride = this.rides.find((item) => item.id === id);
    return ride ? cloneRide(ride) : undefined;
  }

  create(input: CreateRidePostRecord): RideListing {
    const ride: RideListing = {
      id: `ride-created-${this.nextId}`,
      type: "ride",
      title: input.title,
      departureName: input.departureName,
      destinationName: input.destinationName,
      dayLabel: input.dayLabel,
      departureTime: input.departureTime,
      seatsLeft: input.seatsTotal,
      location: {
        lat: input.lat,
        lng: input.lng,
      },
    };

    this.nextId += 1;
    this.rides.unshift(ride);

    return cloneRide(ride);
  }
}

function cloneRide(ride: RideListing): RideListing {
  return {
    ...ride,
    location: { ...ride.location },
  };
}
