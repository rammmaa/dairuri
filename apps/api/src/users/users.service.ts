import { Injectable } from "@nestjs/common";
import type { UserProfileSummary } from "@dairuri/shared";

@Injectable()
export class UsersService {
  findMe(): UserProfileSummary {
    return {
      id: "user-me",
      nickname: "다로리인",
      driverYears: 3,
      mannerTemperature: 40.6,
      completedRides: 12,
      completedJobs: 4,
      recommendationRate: 97,
      verifications: ["phone", "region"],
    };
  }
}
