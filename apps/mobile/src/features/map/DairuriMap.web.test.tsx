import { render, screen } from "@testing-library/react-native";
import { sampleRideListings } from "@dairuri/shared";
import { DairuriMap } from "./DairuriMap.web";

describe("DairuriMap web", () => {
  it("renders live map tiles from a map provider with ride markers", () => {
    render(
      <DairuriMap
        initialRegion={{
          latitude: 35.7001,
          longitude: 128.7342,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        }}
        rides={sampleRideListings}
      />,
    );

    expect(screen.getByText("OpenStreetMap contributors")).toBeTruthy();
    expect(screen.getAllByLabelText(/실시간 지도 타일/).length).toBeGreaterThan(0);
    expect(screen.getByText("다로리 카페")).toBeTruthy();
  });
});
