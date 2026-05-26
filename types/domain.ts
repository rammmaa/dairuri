export type DriverType = "driver" | "nonDriver";
export type PostType = "carpool" | "job";
export type PostStatus = "open" | "closed" | "matched";
export type Weekday = "월" | "화" | "수" | "목" | "금" | "토" | "일";
export type ApplicationStatus = "pending" | "accepted" | "rejected";
export type ChatMessageType = "text" | "system" | "postCard";

export type VehicleInfo = {
  plateNumber: string;
  modelName?: string;
  images: string[];
};

export type UserProfile = {
  id: string;
  nickname: string;
  realName?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  area?: string;
  temperature: number;
  driverType: DriverType;
  vehicle?: VehicleInfo;
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
  days: Weekday[];
  startTime: string;
  endTime?: string;
  price?: number;
  seats?: number;
};

export type JobPost = BasePost & {
  type: "job";
  profileMode?: "resource";
  placeName: string;
  placeAddress?: string;
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
