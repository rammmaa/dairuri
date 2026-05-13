import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  sampleJobListings,
  sampleRideListings,
  type JobListing,
  type RideListing,
} from "@dairuri/shared";
import { fetchJobs, fetchRides } from "../../services/api/dairuriApi";
import { colors } from "../../theme/tokens";
import { JobPostForm } from "./JobPostForm";
import { RidePostForm } from "./RidePostForm";

type FeedStatus = "loading" | "ready" | "error";
type PostScreenMode = "feed" | "rideForm" | "jobForm";

export function PostScreen() {
  const [rides, setRides] = useState<RideListing[]>(sampleRideListings);
  const [jobs, setJobs] = useState<JobListing[]>(sampleJobListings);
  const [status, setStatus] = useState<FeedStatus>("loading");
  const [mode, setMode] = useState<PostScreenMode>("feed");

  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchRides(), fetchJobs()])
      .then(([nextRides, nextJobs]) => {
        if (!isMounted) {
          return;
        }

        setRides(nextRides);
        setJobs(nextJobs);
        setStatus("ready");
      })
      .catch(() => {
        if (isMounted) {
          setStatus("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (mode === "rideForm") {
    return (
      <RidePostForm
        onCreated={(ride) => {
          setRides((currentRides) => [ride, ...currentRides]);
          setMode("feed");
        }}
      />
    );
  }

  if (mode === "jobForm") {
    return (
      <JobPostForm
        onCreated={(job) => {
          setJobs((currentJobs) => [job, ...currentJobs]);
          setMode("feed");
        }}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <Text style={styles.title}>모집글</Text>
      <Text style={styles.statusText}>
        {status === "loading"
          ? "서버에서 모집글을 불러오는 중입니다."
          : status === "error"
            ? "서버 연결이 불안정해 저장된 목록을 먼저 보여주고 있어요."
          : "가까운 라이드와 일자리 모집글을 확인하세요."}
      </Text>
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="라이드 모집글 작성"
          onPress={() => setMode("rideForm")}
          style={styles.actionButton}
        >
          <Text style={styles.actionText}>라이드 작성</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="일자리 모집글 작성"
          onPress={() => setMode("jobForm")}
          style={styles.actionButton}
        >
          <Text style={styles.actionText}>일자리 작성</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>라이드</Text>
      {rides.map((ride) => (
        <View key={ride.id} style={styles.card}>
          <Text style={styles.cardTitle}>{ride.title}</Text>
          <Text style={styles.metaText}>
            {ride.departureName} - {ride.destinationName}
          </Text>
          <Text style={styles.metaText}>
            {ride.dayLabel} | {ride.departureTime} | 남은 자리 {ride.seatsLeft}명
          </Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>일자리</Text>
      {jobs.map((job) => (
        <View key={job.id} style={styles.card}>
          <Text style={styles.cardTitle}>{job.title}</Text>
          <Text style={styles.metaText}>{job.placeName}</Text>
          <Text style={styles.metaText}>
            {job.payLabel} | {job.scheduleLabel}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    minHeight: "100%",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 112,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.headerText,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  statusText: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.activeSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.active,
  },
  actionText: {
    color: colors.tabTextActive,
    fontSize: 14,
    fontWeight: "800",
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.sheet,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 8,
  },
  metaText: {
    color: colors.grayText,
    fontSize: 13,
    lineHeight: 20,
  },
});
