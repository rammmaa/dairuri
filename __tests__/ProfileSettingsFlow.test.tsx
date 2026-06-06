import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

import * as api from "../services/api";
import * as ImagePicker from "expo-image-picker";
import { ProfileEditScreen } from "../screens/profile/ProfileEditScreen";
import { ProfileInfoScreen } from "../screens/profile/ProfileInfoScreen";
import { SettingsScreen } from "../screens/profile/SettingsScreen";
import { SavedPostsScreen } from "../screens/profile/SavedPostsScreen";
import { MyPostsScreen } from "../screens/profile/MyPostsScreen";
import { MyPageScreen } from "../screens/MyPageScreen";
import { mockMe } from "../data/mockDomain";
import { connectMockDatabase, resetMockDatabase } from "../services/mockDb";
import { updateMe } from "../services/mockApi";

const defaultMockMeAvatarUrl =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=420";

describe("Profile settings flow", () => {
  beforeEach(() => {
    mockMe.nickname = "다로리인";
    mockMe.avatarUrl = defaultMockMeAvatarUrl;
    mockMe.driverType = "driver";
    mockMe.driverVerification = {
      licenseVerified: true,
      insuranceVerified: true,
      verifiedAt: "2026-05-14T00:00:00.000Z",
    };
    resetMockDatabase();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the profile home dashboard and opens profile actions", () => {
    const onOpenProfileScreen = jest.fn();

    render(<MyPageScreen onOpenProfileScreen={onOpenProfileScreen} />);

    expect(screen.getByText("매너온도")).toBeTruthy();
    expect(screen.getByText("40.6°C")).toBeTruthy();
    expect(screen.getByText("안정")).toBeTruthy();
    expect(screen.queryByText("완료한 세이라이드 N%의")).toBeNull();
    expect(screen.queryByText("하람")).toBeNull();
    expect(screen.getByText("공지사항")).toBeTruthy();
    expect(screen.getByText("FAQ")).toBeTruthy();
    expect(screen.getByText("어플 정보")).toBeTruthy();
    expect(screen.getByText("약관 및 정책")).toBeTruthy();

    fireEvent.press(screen.getByText("공지사항"));
    expect(onOpenProfileScreen).toHaveBeenCalledWith("notice");

    fireEvent.press(screen.getByText("FAQ"));
    expect(onOpenProfileScreen).toHaveBeenCalledWith("faq");

    fireEvent.press(screen.getByText("어플 정보"));
    expect(onOpenProfileScreen).toHaveBeenCalledWith("appInfo");

    fireEvent.press(screen.getByText("약관 및 정책"));
    expect(onOpenProfileScreen).toHaveBeenCalledWith("terms");

    fireEvent.press(screen.getByTestId("profile-edit-button"));
    expect(onOpenProfileScreen).toHaveBeenCalledWith("edit");

    fireEvent.press(screen.getByText("설정"));
    expect(onOpenProfileScreen).toHaveBeenCalledWith("settings");
  });

  it("uses the Darolink display name in profile app information", () => {
    render(<ProfileInfoScreen kind="appInfo" />);

    expect(screen.getByText("다로링크 앱의 현재 정보를 확인하세요.")).toBeTruthy();
    expect(screen.getByText("다로링크")).toBeTruthy();
    expect(screen.queryByText("다로리 앱의 현재 정보를 확인하세요.")).toBeNull();
    expect(screen.queryByText("다로리")).toBeNull();
  });

  it("shows received applications and opens the review screen", async () => {
    const onOpenApplicationReview = jest.fn();

    render(<MyPageScreen onOpenApplicationReview={onOpenApplicationReview} />);

    expect(await screen.findByText("받은 지원 요청")).toBeTruthy();
    expect(await screen.findByText("‘청도감 학원’ 함께 다니실 사람 구해요")).toBeTruthy();
    expect(screen.getByText("우리마이사랑해")).toBeTruthy();

    fireEvent.press(screen.getByTestId("application-review-entry-application-1"));

    expect(onOpenApplicationReview).toHaveBeenCalledWith("application-1");
  });

  it("hides accepted applications from the pending received-requests card", async () => {
    const database = connectMockDatabase();
    database.applications[0].status = "accepted";

    render(<MyPageScreen />);

    expect(await screen.findByText("받은 지원 요청")).toBeTruthy();
    expect(screen.getByText("0건 대기")).toBeTruthy();
    expect(screen.getByText("아직 검토할 지원 요청이 없어요")).toBeTruthy();
    expect(screen.queryByTestId("application-review-entry-application-1")).toBeNull();
  });

  it("opens the profile image sheet and saves profile edits", async () => {
    const onSaved = jest.fn();
    const updateSpy = jest.spyOn(api, "updateMe");

    render(<ProfileEditScreen onSaved={onSaved} />);

    fireEvent.press(screen.getByTestId("profile-avatar-edit"));

    expect(screen.getByText("현재 프로필 지우기")).toBeTruthy();
    expect(screen.getByText("카메라 열기")).toBeTruthy();
    expect(screen.getByText("사진첩 열기")).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText("닉네임 입력"), "새 다로리");
    fireEvent.press(screen.getByText("비운전자"));
    fireEvent.press(screen.getByTestId("profile-save"));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
    expect(updateSpy).toHaveBeenCalledWith({
      nickname: "새 다로리",
      driverType: "nonDriver",
    });
  });

  it("picks a library image, previews the base64 avatar, and saves it", async () => {
    const onSaved = jest.fn();
    const updateSpy = jest.spyOn(api, "updateMe");
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValueOnce({
      granted: true,
    } as never);
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file:///avatar.jpg",
          base64: "picked-avatar",
          mimeType: "image/jpeg",
        },
      ],
    } as never);

    render(<ProfileEditScreen onSaved={onSaved} />);

    fireEvent.press(screen.getByTestId("profile-avatar-edit"));
    fireEvent.press(screen.getByTestId("profile-image-open-library"));

    const avatarPayload = "data:image/jpeg;base64,picked-avatar";
    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
        expect.objectContaining({ base64: true }),
      );
      expect(screen.getByTestId("profile-avatar-image").props.source).toEqual({
        uri: avatarPayload,
      });
    });

    fireEvent.press(screen.getByTestId("profile-save"));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
    expect(updateSpy).toHaveBeenCalledWith({
      nickname: "다로리인",
      driverType: "driver",
      avatarUrl: avatarPayload,
    });
  });

  it("shows status when camera permission is denied", async () => {
    jest.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValueOnce({
      granted: false,
    } as never);

    render(<ProfileEditScreen />);

    fireEvent.press(screen.getByTestId("profile-avatar-edit"));
    fireEvent.press(screen.getByTestId("profile-image-open-camera"));

    await waitFor(() => {
      expect(screen.getByText("카메라 권한이 필요해요.")).toBeTruthy();
    });
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it("renders account and vehicle data and confirms logout", () => {
    const onLogout = jest.fn();

    render(<SettingsScreen onLogout={onLogout} />);

    expect(screen.getByText("010-0000-0000")).toBeTruthy();
    expect(screen.getByText("test")).toBeTruthy();
    expect(screen.getByText("@example.com")).toBeTruthy();
    expect(screen.getByText("인증됨")).toBeTruthy();
    expect(screen.getByText("123가 ****")).toBeTruthy();
    expect(screen.getByTestId("settings-vehicle-image-0")).toBeTruthy();

    fireEvent.press(screen.getByText("로그아웃"));

    expect(screen.getByText("로그아웃하시겠어요?")).toBeTruthy();
    fireEvent.press(screen.getByText("로그아웃하기"));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("requires matching visible password fields before password change", () => {
    render(<SettingsScreen />);

    fireEvent.press(screen.getByText("비밀번호 변경"));

    expect(screen.getByText("새 비밀번호 확인")).toBeTruthy();
    expect(screen.getByTestId("settings-current-password").props.secureTextEntry).toBe(
      true,
    );
    fireEvent.press(screen.getByTestId("settings-current-password-visibility-toggle"));
    expect(screen.getByTestId("settings-current-password").props.secureTextEntry).toBe(
      false,
    );

    fireEvent.changeText(screen.getByTestId("settings-current-password"), "password123");
    fireEvent.changeText(screen.getByTestId("settings-new-password"), "newpassword123");
    fireEvent.changeText(screen.getByTestId("settings-new-password-confirm"), "different");

    expect(screen.getByText("새 비밀번호가 일치하지 않아요.")).toBeTruthy();
    expect(screen.getByTestId("settings-password-submit").props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("blocks switching to driver before driver verification is complete", async () => {
    const database = connectMockDatabase();
    database.users[0].driverType = "nonDriver";
    database.users[0].driverVerification = undefined;

    await expect(updateMe({ driverType: "driver" })).rejects.toThrow(
      "운전자로 변경하려면 운전면허와 자동차 보험 인증이 필요해요.",
    );
  });

  it("renders saved posts from mock posts", () => {
    render(<SavedPostsScreen />);

    expect(screen.getByText("내 찜")).toBeTruthy();
    expect(screen.getByText("농촌 일손과 카페 보조 도울 수 있어요")).toBeTruthy();
    expect(screen.getByText("총 1건")).toBeTruthy();
  });

  it("renders my posts with an empty-safe state", () => {
    render(<MyPostsScreen posts={[]} />);

    expect(screen.getByText("내가 쓴 모집글")).toBeTruthy();
    expect(screen.getByText("아직 작성한 모집글이 없어요")).toBeTruthy();
  });
});
