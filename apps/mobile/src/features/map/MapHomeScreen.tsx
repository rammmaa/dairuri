import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RideListing } from "@dairuri/shared";
import { AppIcon } from "../../components/AppIcon";
import { FilterPill } from "../../components/FilterPill";
import { colors } from "../../theme/tokens";
import { DairuriMap } from "./DairuriMap";
import type { MapRegion } from "./DairuriMap.types";

export type MapDataStatus = "loading" | "ready" | "error";

interface MapHomeScreenProps {
  rides: RideListing[];
  status: MapDataStatus;
}

type ServiceFilter = "정기 라이드" | "비정기 라이드" | "버스 정보";
type SheetTab = "rideShare" | "job";
type MenuFilter = "date" | "time" | "departure" | "sort";

const defaultRegion: MapRegion = {
  latitude: 35.7001,
  longitude: 128.7342,
  latitudeDelta: 0.018,
  longitudeDelta: 0.018,
};

const menuOptions: Record<MenuFilter, string[]> = {
  date: ["오늘", "이번 주", "주말"],
  time: ["오전", "오후", "저녁"],
  departure: ["다로리 카페", "읍내 정류장", "청도역"],
  sort: ["가까운 순", "시간 빠른 순", "자리 많은 순"],
};

export function MapHomeScreen({ rides, status }: MapHomeScreenProps) {
  const [activeService, setActiveService] = useState<ServiceFilter>("정기 라이드");
  const [activeSheetTab, setActiveSheetTab] = useState<SheetTab>("rideShare");
  const [activeMenu, setActiveMenu] = useState<MenuFilter | null>(null);
  const [feedback, setFeedback] = useState("");
  const displayedRides =
    activeService === "정기 라이드" && activeSheetTab === "rideShare" ? rides : [];
  const primaryRide = displayedRides[0];
  const initialRegion = primaryRide
    ? {
        ...defaultRegion,
        latitude: primaryRide.location.lat,
        longitude: primaryRide.location.lng,
      }
    : defaultRegion;

  const selectService = (service: ServiceFilter) => {
    setActiveService(service);
    setActiveMenu(null);
    setFeedback(`${service} 필터 적용됨`);
  };

  const selectSheetTab = (tab: SheetTab) => {
    setActiveSheetTab(tab);
    setActiveMenu(null);
    setFeedback(tab === "rideShare" ? "라이드 쉐어 목록" : "일자리 목록");
  };

  const openMenu = (menu: MenuFilter) => {
    setActiveMenu((currentMenu) => (currentMenu === menu ? null : menu));
  };

  const selectOption = (option: string) => {
    setFeedback(`${option} 필터 적용됨`);
    setActiveMenu(null);
  };

  return (
    <View style={styles.mapScreen}>
      <View style={styles.mapCanvas}>
        <DairuriMap initialRegion={initialRegion} rides={displayedRides} />
        <View style={styles.searchBar}>
          <Text style={styles.searchText}>장소 검색창</Text>
        </View>
        <View style={styles.quickFilters}>
          {(["정기 라이드", "비정기 라이드", "버스 정보"] as ServiceFilter[]).map((service) => (
            <FilterPill
              key={service}
              label={service}
              onPress={() => selectService(service)}
              selected={activeService === service}
            />
          ))}
        </View>
        <View style={styles.currentDot} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="현재 위치로 이동"
          onPress={() => setFeedback("현재 위치 기준으로 지도 이동")}
          style={styles.locateButton}
        >
          <AppIcon name="crosshair" size={22} color={colors.icon} />
        </Pressable>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetTabs}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="라이드 쉐어 목록"
            accessibilityState={{ selected: activeSheetTab === "rideShare" }}
            onPress={() => selectSheetTab("rideShare")}
            style={[
              styles.sheetTab,
              activeSheetTab === "rideShare" ? styles.sheetTabSelected : null,
            ]}
          >
            <Text
              style={[
                styles.sheetTabText,
                activeSheetTab === "rideShare" ? styles.sheetTabTextSelected : null,
              ]}
            >
              라이드 쉐어
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="일자리 목록"
            accessibilityState={{ selected: activeSheetTab === "job" }}
            onPress={() => selectSheetTab("job")}
            style={[
              styles.sheetTab,
              activeSheetTab === "job" ? styles.sheetTabSelected : null,
            ]}
          >
            <Text
              style={[
                styles.sheetTabText,
                activeSheetTab === "job" ? styles.sheetTabTextSelected : null,
              ]}
            >
              일자리
            </Text>
          </Pressable>
        </View>
        <View style={styles.hotTitleRow}>
          <Text style={styles.hotTitle}>지금 핫한 모집글</Text>
          <Text style={styles.hotTitleAccent}>TOP20</Text>
        </View>
        <View style={styles.filterRow}>
          <FilterPill
            label="날짜"
            icon="chevron-down"
            onPress={() => openMenu("date")}
            selected={activeMenu === "date"}
          />
          <FilterPill
            label="시간"
            icon="chevron-down"
            onPress={() => openMenu("time")}
            selected={activeMenu === "time"}
          />
          <FilterPill
            label="출발 장소"
            icon="chevron-down"
            onPress={() => openMenu("departure")}
            selected={activeMenu === "departure"}
          />
        </View>
        {activeMenu ? (
          <View style={styles.optionRow}>
            {menuOptions[activeMenu].map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={`${option} 선택`}
                onPress={() => selectOption(option)}
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}
        <View style={styles.listHeader}>
          <Text style={styles.totalText}>#{displayedRides.length > 0 ? "1." : "0."}</Text>
          <FilterPill
            label="정렬조건"
            icon="chevron-down"
            onPress={() => openMenu("sort")}
            selected={activeMenu === "sort"}
          />
        </View>
        {primaryRide ? (
          <View style={styles.rideCard}>
            <View style={styles.cardTop}>
              <Text style={styles.cardMeta}>다로리인</Text>
              <AppIcon name="heart" size={24} color={colors.iconMuted} />
            </View>
            <Text style={styles.cardTitle}>{primaryRide.title}</Text>
            <Text style={styles.greenMeta}>
              {primaryRide.dayLabel} | {primaryRide.departureTime}
            </Text>
            <Text style={styles.grayMeta}>
              {primaryRide.departureName} - {primaryRide.destinationName}
            </Text>
            <Text style={styles.grayMeta}>남은 자리 {primaryRide.seatsLeft}명</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>표시할 {activeService} 모집글이 아직 없습니다.</Text>
        )}
        {status === "loading" ? (
          <Text style={styles.statusText}>서버에서 모집글을 불러오는 중입니다.</Text>
        ) : null}
        {status === "error" ? (
          <Text style={styles.statusText}>
            서버 연결이 불안정해 저장된 목록을 먼저 보여주고 있어요.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapCanvas: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.mapBackground,
  },
  searchBar: {
    position: "absolute",
    top: 33,
    left: 44,
    right: 45,
    height: 53,
    borderRadius: 10,
    backgroundColor: "#f4f4f4",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 25,
  },
  searchText: {
    color: colors.black,
    fontSize: 24,
    fontWeight: "400",
  },
  quickFilters: {
    position: "absolute",
    top: 101,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  currentDot: {
    position: "absolute",
    top: 208,
    left: "31%",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.currentBlue,
    borderWidth: 5,
    borderColor: colors.currentHalo,
  },
  locateButton: {
    position: "absolute",
    right: 22,
    bottom: 116,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.icon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },
  bottomSheet: {
    height: 368,
    backgroundColor: "#e6e6e6",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 37,
    paddingTop: 14,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 50,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.handle,
    marginBottom: 8,
  },
  sheetTabs: {
    height: 53,
    borderRadius: 10,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    padding: 4,
  },
  sheetTab: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTabSelected: {
    backgroundColor: "#d9d9d9",
  },
  sheetTabText: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "400",
  },
  sheetTabTextSelected: {
    fontWeight: "700",
  },
  hotTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  hotTitle: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "400",
  },
  hotTitleAccent: {
    color: colors.active,
    fontSize: 20,
    fontWeight: "900",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  optionRow: {
    minHeight: 36,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  optionButton: {
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  feedbackText: {
    minHeight: 18,
    color: colors.active,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 8,
    textAlign: "center",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "400",
  },
  rideCard: {
    minHeight: 73,
    borderRadius: 5,
    backgroundColor: "#d9d9d9",
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardMeta: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "500",
  },
  cardTitle: {
    color: colors.black,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
    marginBottom: 10,
  },
  greenMeta: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  grayMeta: {
    color: colors.grayText,
    fontSize: 14,
    lineHeight: 22,
  },
  emptyText: {
    color: colors.grayText,
    fontSize: 14,
    lineHeight: 20,
  },
  statusText: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
});
