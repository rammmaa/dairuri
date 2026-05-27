import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import * as api from "../services/api";
import { ProfileEditScreen } from "../screens/profile/ProfileEditScreen";
import { SettingsScreen } from "../screens/profile/SettingsScreen";
import { SavedPostsScreen } from "../screens/profile/SavedPostsScreen";
import { MyPostsScreen } from "../screens/profile/MyPostsScreen";

describe("Profile settings flow", () => {
  it("opens the profile image sheet and saves profile edits", async () => {
    const onSaved = jest.fn();
    const updateSpy = jest.spyOn(api, "updateMe");

    render(<ProfileEditScreen onSaved={onSaved} />);

    expect(screen.getByText("사진 업로드는 아직 지원하지 않아요.")).toBeTruthy();
    expect(screen.getByTestId("profile-avatar-edit").props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(screen.queryByText("사진첩 열기")).toBeNull();

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
    expect(screen.getByText("test@example.com")).toBeTruthy();
    expect(screen.getByText("123가 5678")).toBeTruthy();
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
    render(<MyPostsScreen />);

    expect(screen.getByText("내가 쓴 모집글")).toBeTruthy();
    expect(screen.getByText("아직 작성한 모집글이 없어요")).toBeTruthy();
  });
});
