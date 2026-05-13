import type { RideListing } from "@dairuri/shared";

export const seedRideListings: RideListing[] = [
  {
    id: "ride-cafe-weekly",
    type: "ride",
    title: "다로리 카페 매주 같이 가실 분 구해요",
    departureName: "다로리 카페",
    destinationName: "청도역",
    dayLabel: "매주 월, 수",
    departureTime: "오전 9:20",
    seatsLeft: 2,
    location: { lat: 35.7001, lng: 128.7342 },
  },
  {
    id: "ride-market-saturday",
    type: "ride",
    title: "토요일 장 보러 같이 가요",
    departureName: "읍내 정류장",
    destinationName: "청도시장",
    dayLabel: "토요일",
    departureTime: "오전 10:00",
    seatsLeft: 1,
    location: { lat: 35.6988, lng: 128.7311 },
  },
];
