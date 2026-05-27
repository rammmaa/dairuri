import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import * as api from "../services/api";
import { ProfileEditScreen } from "../screens/profile/ProfileEditScreen";
import { SettingsScreen } from "../screens/profile/SettingsScreen";
import { SavedPostsScreen } from "../screens/profile/SavedPostsScreen";
import { MyPostsScreen } from "../screens/profile/MyPostsScreen";
import { MyPageScreen } from "../screens/MyPageScreen";

describe("Profile settings flow", () => {
  it("renders the profile home dashboard and opens profile actions", () => {
    const onOpenProfileScreen = jest.fn();

    render(<MyPageScreen onOpenProfileScreen={onOpenProfileScreen} />);

    expect(screen.getByText("매너온도")).toBeTruthy();
    expect(screen.getByText("40.6도")).toBeTruthy();
    expect(screen.getByText("공지사항")).toBeTruthy();
    expect(screen.getByText("FAQ")).toBeTruthy();
    expect(screen.getByText("어플 정보")).toBeTruthy();
    expect(screen.getByText("약관 및 정책")).toBeTruthy();

    fireEvent.press(screen.getByTestId("profile-edit-button"));
    expect(onOpenProfileScreen).toHaveBeenCalledWith("edit");

    fireEvent.press(screen.getByText("설정"));
    expect(onOpenProfileScreen).toHaveBeenCalledWith("settings");
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

  it("renders account and vehicle data and confirms logout", () => {
    const onLogout = jest.fn();

    render(<SettingsScreen onLogout={onLogout} />);

    expect(screen.getByText("010-0000-0000")).toBeTruthy();
    expect(screen.getByText("test")).toBeTruthy();
    expect(screen.getByText("@example.com")).toBeTruthy();
    expect(screen.getByText("123가 ****")).toBeTruthy();
    expect(screen.getByTestId("settings-vehicle-image-0")).toBeTruthy();

    fireEvent.press(screen.getByText("로그아웃"));

    expect(screen.getByText("로그아웃하시겠어요?")).toBeTruthy();
    fireEvent.press(screen.getByText("로그아웃하기"));

    expect(onLogout).toHaveBeenCalledTimes(1);
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
