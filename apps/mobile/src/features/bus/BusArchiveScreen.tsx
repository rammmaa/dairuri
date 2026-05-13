import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { BusReport } from "@dairuri/shared";
import { AppIcon } from "../../components/AppIcon";
import {
  createBusReport,
  fetchRecentBusReports,
} from "../../services/api/dairuriApi";
import { colors } from "../../theme/tokens";

const routeNumbers = ["1", "2", "3", "4", "5", "6"];
const currentPlace = {
  placeName: "다로리 카페",
  lat: 35.7001,
  lng: 128.7342,
};

export function BusArchiveScreen() {
  const [selectedRoute, setSelectedRoute] = useState("3");
  const [recentReports, setRecentReports] = useState<BusReport[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clockText, setClockText] = useState(() => formatTime(new Date()));

  useEffect(() => {
    let isMounted = true;

    fetchRecentBusReports(selectedRoute)
      .then((reports) => {
        if (isMounted) {
          setRecentReports(reports);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatusMessage("최근 제보를 불러오지 못했어요.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRoute]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setClockText(formatTime(new Date()));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const submitReport = async () => {
    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const report = await createBusReport({
        routeNumber: selectedRoute,
        placeName: currentPlace.placeName,
        lat: currentPlace.lat,
        lng: currentPlace.lng,
      });
      setRecentReports((reports) => [report, ...reports].slice(0, 20));
      setStatusMessage(`${report.routeNumber}번 버스 제보가 저장됐어요`);
    } catch {
      setStatusMessage("버스 제보 저장에 실패했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <View style={styles.header}>
        <AppIcon name="chevron-left" size={24} color={colors.ink} />
        <Text style={styles.headerTitle}>버스 아카이빙</Text>
      </View>
      <View style={styles.routeRow}>
        {routeNumbers.map((route) => (
          <Pressable
            key={route}
            accessibilityRole="button"
            accessibilityLabel={`${route}번 버스 노선`}
            accessibilityState={{ selected: selectedRoute === route }}
            onPress={() => setSelectedRoute(route)}
            style={[
              styles.routeChip,
              selectedRoute === route ? styles.routeChipSelected : null,
            ]}
          >
            <Text
              style={[
                styles.routeText,
                selectedRoute === route ? styles.routeTextSelected : null,
              ]}
            >
              {route}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.busCard}>
        <Text style={styles.busTitle}>방금 버스 봤어요!</Text>
        <Text style={styles.timerText}>{clockText}</Text>
        <View style={styles.locationPill}>
          <View style={styles.blueDot} />
          <Text style={styles.locationText}>현위치: {currentPlace.placeName}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="버스 제보하기"
          disabled={isSubmitting}
          onPress={submitReport}
          style={styles.busButton}
        >
          <AppIcon name="truck" size={28} color={colors.busBlue} />
        </Pressable>
        <Text style={styles.helperText}>
          버튼을 누르면,{`\n`}현재 시각과 위치가 즉시 저장됩니다.
        </Text>
        {statusMessage ? (
          <Text style={styles.statusText}>{statusMessage}</Text>
        ) : null}
      </View>
      {recentReports.length > 0 ? (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>최근 제보</Text>
          {recentReports.map((report) => (
            <Text key={report.id} style={styles.recentItem}>
              {report.routeNumber}번 | {report.placeName}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", { hour12: false });
}

const styles = StyleSheet.create({
  pageContent: {
    minHeight: "100%",
    paddingBottom: 100,
    backgroundColor: colors.background,
  },
  header: {
    height: 72,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: colors.headerText,
    fontSize: 20,
    fontWeight: "700",
  },
  routeRow: {
    paddingHorizontal: 22,
    paddingVertical: 28,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  routeChip: {
    width: 47,
    height: 47,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.routeBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  routeChipSelected: {
    borderColor: colors.busBlue,
    backgroundColor: colors.busBlue,
  },
  routeText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.black,
  },
  routeTextSelected: {
    color: colors.background,
  },
  busCard: {
    marginHorizontal: 30,
    minHeight: 455,
    borderRadius: 16,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    paddingTop: 34,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 1,
    elevation: 2,
  },
  busTitle: {
    color: colors.busBlue,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 24,
  },
  timerText: {
    color: colors.black,
    fontSize: 46,
    fontWeight: "900",
    marginBottom: 34,
  },
  locationPill: {
    minHeight: 40,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 50,
  },
  blueDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.busBlue,
  },
  locationText: {
    fontSize: 12,
    color: colors.locationText,
  },
  busButton: {
    width: 150,
    height: 100,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,
  },
  helperText: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  statusText: {
    color: colors.busBlue,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 18,
    textAlign: "center",
  },
  recentSection: {
    marginHorizontal: 30,
    marginTop: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.sheet,
    padding: 16,
  },
  recentTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },
  recentItem: {
    color: colors.grayText,
    fontSize: 13,
    lineHeight: 20,
  },
});
