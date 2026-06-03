export type DriverType = "driver" | "nonDriver";
export type PostType = "carpool" | "job";
export type PostStatus = "open" | "closed" | "matched";
export type Weekday = "월" | "화" | "수" | "목" | "금" | "토" | "일";
export type ApplicationStatus = "pending" | "accepted" | "rejected";
export type ChatMessageType = "text" | "system" | "postCard" | "image";

export type GeoCoordinate = {
  latitude: number;
  longitude: number;
};

export type DriverVerification = {
  licenseVerified: boolean;
  insuranceVerified: boolean;
  verifiedAt?: string;
};

export type VehicleInfo = {
  plateNumber: string;
  modelName?: string;
  images: string[];
};

export type UserProfile = {
  id: string;
  loginId?: string;
  nickname: string;
  realName?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  area?: string;
  temperature: number;
  driverType: DriverType;
  vehicle?: VehicleInfo;
  driverVerification?: DriverVerification;
};

export type BasePost = {
  id: string;
  type: PostType;
  title: string;
  body: string;
  author: UserProfile;
  imageUrls: string[];
  liked: boolean;
  status: PostStatus;
  createdAt: string;
};

export type CarpoolPost = BasePost & {
  type: "carpool";
  departure: string;
  destination: string;
  departureCoordinate?: GeoCoordinate;
  destinationCoordinate?: GeoCoordinate;
  days: Weekday[];
  startTime: string;
  endTime?: string;
  scheduleNote?: string;
  price?: number;
  seats?: number;
};

export type JobPost = BasePost & {
  type: "job";
  profileMode?: "resource";
  placeName: string;
  placeAddress?: string;
  placeCoordinate?: GeoCoordinate;
  days: Weekday[];
  startTime: string;
  endTime: string;
  wageType: "hourly" | "monthly";
  wageAmount: number;
  jobCategory?: string;
  availableTasks?: string[];
  employmentTypes?: Array<"fullTime" | "partTime" | "shortTerm">;
  preferredPay?: string;
  availabilityNote?: string;
  contactNote?: string;
};

export type Post = CarpoolPost | JobPost;

export type Application = {
  id: string;
  postId: string;
  applicant: UserProfile;
  intro: string;
  status: ApplicationStatus;
  createdAt: string;
  rejectionReason?: string;
};

export type ApplicationDetail = {
  application: Application;
  post: Post;
};

export type UpdateUserProfileInput = {
  nickname?: string;
  driverType?: DriverType;
  avatarUrl?: string | null;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type SignupInput = {
  loginId: string;
  nickname: string;
  realName?: string;
  phone: string;
  email?: string;
  password: string;
  driverType: DriverType;
  vehicle?: VehicleInfo;
  phoneVerification: PhoneVerificationProof;
};

export type AuthSession = {
  token: string;
  user: UserProfile;
};

export type PhoneVerificationProof = {
  id: string;
  token: string;
};

export type PhoneVerificationStartInput = {
  phone: string;
};

export type PhoneVerificationStartResult = {
  verificationId: string;
  expiresAt: string;
  debugCode?: string;
};

export type PhoneVerificationConfirmInput = {
  verificationId: string;
  code: string;
};

export type PhoneVerificationConfirmResult = {
  verificationId: string;
  phone: string;
  verifiedToken: string;
  verifiedAt: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type MannerRatingInput = {
  roomId: string;
  tags: string[];
};

export type MannerRatingResult = {
  targetUserId: string;
  temperature: number;
};

export type ChatRoom = {
  id: string;
  title: string;
  subtitle?: string;
  participants: UserProfile[];
  postId?: string;
  lastMessage?: string;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  senderId?: string;
  type: ChatMessageType;
  text?: string;
  imageUrl?: string;
  createdAt: string;
  post?: Post;
};

export type MapMarkerItem = {
  id: string;
  postId?: string;
  type: "job" | "carpool" | "place" | "current";
  latitude: number;
  longitude: number;
  title?: string;
};

export type RouteOption = {
  id: string;
  label: string;
  color: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
};

export type BusRoute = {
  id: string;
  code: string;
  name: string;
  color: string;
  /** ISO timestamp of the most recent community sighting on any stop of this
   *  route. Server-derived; undefined when no sighting has been recorded yet. */
  lastSightingAt?: string;
};

export type BusStop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** ISO timestamp of the most recent community sighting at this stop.
   *  Server-derived; clients never write it directly. */
  lastSightingAt?: string;
};

export type BusRouteStop = {
  routeId: string;
  stopId: string;
  sequence: number;
};

export type BusSighting = {
  id: string;
  routeId: string;
  stopId: string;
  /** 6-char anonymized identifier of the reporter, stable per reporter under
   *  a fixed salt. Derived server-side from
   *  sha256(reporter_id + DARORI_REPORTER_LABEL_SALT)[0..5].
   *  Equals the literal "deleted" when the reporter account has been removed. */
  reporterLabel: string;
  latitude: number;
  longitude: number;
  createdAt: string;
};
