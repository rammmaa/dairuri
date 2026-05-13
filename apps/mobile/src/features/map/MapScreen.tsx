import { useEffect, useState } from "react";
import { sampleRideListings, type RideListing } from "@dairuri/shared";
import { fetchRides } from "../../services/api/dairuriApi";
import { MapHomeScreen, type MapDataStatus } from "./MapHomeScreen";

export function MapScreen() {
  const [rides, setRides] = useState<RideListing[]>(sampleRideListings);
  const [status, setStatus] = useState<MapDataStatus>("loading");

  useEffect(() => {
    let isMounted = true;

    fetchRides()
      .then((nextRides) => {
        if (!isMounted) {
          return;
        }

        setRides(nextRides);
        setStatus("ready");
      })
      .catch(() => {
        if (isMounted) {
          setStatus("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return <MapHomeScreen rides={rides} status={status} />;
}
