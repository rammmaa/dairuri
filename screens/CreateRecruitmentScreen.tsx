import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";
import {
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  Clock3,
  FileText,
  MapPin,
  Plus,
  Search,
  X,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { MapPreview } from "../components/MapPreview";
import { ScreenTitle } from "../components/ScreenTitle";
import { colors } from "../constants/colors";
import {
  getSafeAreaBottomInset,
  getSafeAreaTopInset,
  useRuntimeSafeAreaInsets,
} from "../constants/safeArea";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { createPost } from "../services/api";
import { searchPlaceCandidates as searchApiPlaceCandidates } from "../services/places";
import type { GeoCoordinate, Post, Weekday } from "../types/domain";
import type { PlaceCandidate } from "../types/place";

type RecruitmentType = "ride" | "work";
type RoutePlaceTarget = "departure" | "destination";
type PlacePickerTarget = RoutePlaceTarget | "workArea";

export type CreateRecruitmentScreenProps = {
  onCancel?: () => void;
  onComplete?: (type: RecruitmentType) => void;
};

type AgreementId =
  | "chat"
  | "terms"
  | "privacy"
  | "thirdParty";

type Agreements = Record<AgreementId, boolean>;

type ScheduleEntry = {
  id: string;
  days: string[];
  startTime: string;
  endTime: string;
};

const weekdays = ["월", "화", "수", "목", "금", "토", "일"] as const;
const unknownWeekdayOrder = weekdays.length;
const weekdayOrder = new Map<string, number>(
  weekdays.map((day, index) => [day, index]),
);

const workCategories = [
  "외식/음료",
  "유통/판매",
  "문화/여가/생활",
  "서비스",
  "사무/회계",
  "고객상담/영업",
  "생산/건설",
  "IT/인터넷",
  "교육/강사",
  "디자인",
  "운전/배달",
  "병원/간호/연구",
  "기타",
] as const;

const agreementItems: { id: AgreementId; label: string }[] = [
  { id: "chat", label: "상호 채팅 동의" },
  { id: "terms", label: "서비스 이용약관" },
  { id: "privacy", label: "개인정보 수집 및 이용 동의" },
  { id: "thirdParty", label: "개인정보 제3자 제공 동의" },
];

const initialAgreements: Agreements = {
  chat: false,
  terms: false,
  privacy: false,
  thirdParty: false,
};

export function CreateRecruitmentScreen({
  onCancel,
  onComplete,
}: CreateRecruitmentScreenProps) {
  const [screenIndex, setScreenIndex] = useState(0);
  const [selectedType, setSelectedType] = useState<RecruitmentType | null>(null);
  const [placePickerTarget, setPlacePickerTarget] =
    useState<PlacePickerTarget | null>(null);

  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [departureCoordinate, setDepartureCoordinate] =
    useState<GeoCoordinate | null>(null);
  const [destinationCoordinate, setDestinationCoordinate] =
    useState<GeoCoordinate | null>(null);
  const [rideDays, setRideDays] = useState<string[]>([]);
  const [rideStartTime, setRideStartTime] = useState("");
  const [rideEndTime, setRideEndTime] = useState("");
  const [rideScheduleEntries, setRideScheduleEntries] = useState<ScheduleEntry[]>(
    [],
  );
  const [rideTag, setRideTag] = useState("");
  const [rideTitle, setRideTitle] = useState("");
  const [rideCapacity, setRideCapacity] = useState("");
  const [rideDetails, setRideDetails] = useState("");

  const [workTitle, setWorkTitle] = useState("");
  const [workArea, setWorkArea] = useState("");
  const [workAreaAddress, setWorkAreaAddress] = useState("");
  const [workAreaCoordinate, setWorkAreaCoordinate] =
    useState<GeoCoordinate | null>(null);
  const [workTaskCategories, setWorkTaskCategories] = useState<string[]>([]);
  const [workDays, setWorkDays] = useState<string[]>([]);
  const [workStartTime, setWorkStartTime] = useState("");
  const [workEndTime, setWorkEndTime] = useState("");
  const [workScheduleEntries, setWorkScheduleEntries] = useState<ScheduleEntry[]>(
    [],
  );
  const [workPay, setWorkPay] = useState("");
  const [workDetails, setWorkDetails] = useState("");

  const [agreements, setAgreements] = useState<Agreements>(initialAgreements);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const accent = selectedType === "work" ? colors.yellow : colors.mint;
  const accentDark = selectedType === "work" ? colors.yellowText : colors.mintDark;
  const accentLight = selectedType === "work" ? colors.yellowLight : colors.mintLight;
  const branchStepIndex = screenIndex - 1;
  const totalScreens = 6;
  const progress = selectedType
    ? Math.min((screenIndex + 1) / totalScreens, 1)
    : 0.22;
  const insets = useRuntimeSafeAreaInsets();
  const topInset = getSafeAreaTopInset(insets);
  const bottomInset = getSafeAreaBottomInset(insets);

  const allAgreementsChecked = useMemo(
    () => agreementItems.every((item) => agreements[item.id]),
    [agreements],
  );

  const isValid = useMemo(() => {
    if (screenIndex === 0) {
      return selectedType !== null;
    }

    if (selectedType === "ride") {
      if (branchStepIndex === 0) {
        return hasText(departure) && hasText(destination);
      }
      if (branchStepIndex === 1) {
        return rideScheduleEntries.length > 0 && hasText(rideTag);
      }
      if (branchStepIndex === 2) {
        return hasText(rideTitle) && hasText(rideCapacity);
      }
      if (branchStepIndex === 3) {
        return hasText(rideDetails) && allAgreementsChecked;
      }
      return true;
    }

    if (selectedType === "work") {
      if (branchStepIndex === 0) {
        return hasText(workTitle) && workTaskCategories.length > 0;
      }
      if (branchStepIndex === 1) {
        return hasText(workArea);
      }
      if (branchStepIndex === 2) {
        return workScheduleEntries.length > 0 && hasText(workPay);
      }
      if (branchStepIndex === 3) {
        return hasText(workDetails) && allAgreementsChecked;
      }
      return true;
    }

    return false;
  }, [
    allAgreementsChecked,
    branchStepIndex,
    departure,
    destination,
    rideCapacity,
    rideDetails,
    rideScheduleEntries.length,
    rideTag,
    rideTitle,
    screenIndex,
    selectedType,
    workDetails,
    workArea,
    workPay,
    workScheduleEntries.length,
    workTaskCategories.length,
    workTitle,
  ]);

  const handleBack = () => {
    if (screenIndex === 0) {
      onCancel?.();
      return;
    }

    setScreenIndex((current) => current - 1);
  };

  const handleNext = async () => {
    if (!isValid || submitting || selectedType === null) {
      return;
    }

    setSubmitError(null);

    if (screenIndex === totalScreens - 1) {
      setSubmitting(true);
      try {
        await createPost(buildCreatePostInput(selectedType));
        onComplete?.(selectedType);
      } catch {
        setSubmitError("모집글 등록에 실패했어요. 잠시 후 다시 시도해주세요.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setScreenIndex((current) => current + 1);
  };

  const handleSelectPlace = (place: PlaceCandidate) => {
    const coordinate = {
      latitude: place.latitude,
      longitude: place.longitude,
    };

    if (placePickerTarget === "departure") {
      setDeparture(place.name);
      setDepartureCoordinate(coordinate);
    } else if (placePickerTarget === "destination") {
      setDestination(place.name);
      setDestinationCoordinate(coordinate);
    } else if (placePickerTarget === "workArea") {
      setWorkArea(place.name);
      setWorkAreaAddress(place.address);
      setWorkAreaCoordinate(coordinate);
    }

    setPlacePickerTarget(null);
  };

  const toggleAgreement = (id: AgreementId) => {
    setAgreements((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const toggleRideDay = (day: string) => {
    setRideDays((current) => toggleValue(current, day));
  };

  const toggleWorkDay = (day: string) => {
    setWorkDays((current) => toggleValue(current, day));
  };

  const toggleWorkTaskCategory = (category: string) => {
    setWorkTaskCategories((current) => toggleValue(current, category));
  };

  const handleAddRideSchedule = () => {
    const entry = createScheduleEntry(
      rideDays,
      rideStartTime,
      rideEndTime,
      rideScheduleEntries.length,
    );

    if (!entry) {
      return;
    }

    setRideScheduleEntries((current) =>
      sortScheduleEntries([...current, entry]),
    );
    setRideDays([]);
    setRideStartTime("");
    setRideEndTime("");
  };

  const handleRemoveRideSchedule = (entryId: string) => {
    setRideScheduleEntries((current) =>
      current.filter((entry) => entry.id !== entryId),
    );
  };

  const handleAddWorkSchedule = () => {
    const entry = createScheduleEntry(
      workDays,
      workStartTime,
      workEndTime,
      workScheduleEntries.length,
    );

    if (!entry) {
      return;
    }

    setWorkScheduleEntries((current) =>
      sortScheduleEntries([...current, entry]),
    );
    setWorkDays([]);
    setWorkStartTime("");
    setWorkEndTime("");
  };

  const handleRemoveWorkSchedule = (entryId: string) => {
    setWorkScheduleEntries((current) =>
      current.filter((entry) => entry.id !== entryId),
    );
  };

  function buildCreatePostInput(type: RecruitmentType): Partial<Post> {
    if (type === "work") {
      const sortedSchedules = sortScheduleEntries(workScheduleEntries);
      const scheduleLabel = formatScheduleEntries(sortedSchedules);
      const firstSchedule = sortedSchedules[0];

      return {
        type: "job",
        profileMode: "resource",
        title: workTitle.trim(),
        body: workDetails.trim(),
        placeName: workArea.trim(),
        placeAddress: workAreaAddress.trim() || undefined,
        placeCoordinate: workAreaCoordinate ?? undefined,
        days: getScheduleEntryDays(sortedSchedules) as Weekday[],
        startTime: firstSchedule?.startTime ?? "",
        endTime: firstSchedule?.endTime ?? "",
        wageType: "hourly",
        wageAmount: parseCurrencyNumber(workPay),
        jobCategory: formatCategories(workTaskCategories),
        availableTasks: workTaskCategories,
        employmentTypes: ["partTime", "shortTerm"],
        preferredPay: formatHourlyPay(workPay),
        availabilityNote: scheduleLabel,
        contactNote: workDetails.trim(),
      };
    }

    const sortedSchedules = sortScheduleEntries(rideScheduleEntries);
    const firstSchedule = sortedSchedules[0];

    return {
      type: "carpool",
      title: rideTitle.trim(),
      body: rideDetails.trim(),
      departure,
      destination,
      departureCoordinate: departureCoordinate ?? undefined,
      destinationCoordinate: destinationCoordinate ?? undefined,
      days: getScheduleEntryDays(sortedSchedules) as Weekday[],
      startTime: firstSchedule?.startTime ?? "",
      endTime: firstSchedule?.endTime ?? undefined,
      scheduleNote: formatScheduleEntries(sortedSchedules),
      seats: parseCurrencyNumber(rideCapacity),
    };
  }

  const content =
    screenIndex === 0 ? (
      <TypeSelectionStep
        selectedType={selectedType}
        onSelect={setSelectedType}
      />
    ) : selectedType === "work" ? (
      branchStepIndex === 0 ? (
        <WorkBasicsStep
          title={workTitle}
          selectedCategories={workTaskCategories}
          accent={accent}
          accentDark={accentDark}
          accentLight={accentLight}
          onChangeTitle={setWorkTitle}
          onToggleCategory={toggleWorkTaskCategory}
        />
      ) : branchStepIndex === 1 ? (
        <WorkAreaStep
          area={workArea}
          accent={accent}
          onOpenPlacePicker={() => setPlacePickerTarget("workArea")}
        />
      ) : branchStepIndex === 2 ? (
        <WorkScheduleStep
          selectedDays={workDays}
          startTime={workStartTime}
          endTime={workEndTime}
          schedules={workScheduleEntries}
          pay={workPay}
          accent={accent}
          accentDark={accentDark}
          onToggleDay={toggleWorkDay}
          onChangeStartTime={(value) => setWorkStartTime(formatTimeInput(value))}
          onChangeEndTime={(value) => setWorkEndTime(formatTimeInput(value))}
          onCommitStartTime={() =>
            setWorkStartTime((current) => commitTimeInput(current))
          }
          onCommitEndTime={() =>
            setWorkEndTime((current) => commitTimeInput(current))
          }
          onAddSchedule={handleAddWorkSchedule}
          onRemoveSchedule={handleRemoveWorkSchedule}
          onChangePay={(value) => setWorkPay(formatCurrency(value))}
        />
      ) : branchStepIndex === 3 ? (
        <DetailsStep
          type="work"
          details={workDetails}
          agreements={agreements}
          accent={accent}
          accentDark={accentDark}
          onChangeDetails={setWorkDetails}
          onToggleAgreement={toggleAgreement}
        />
      ) : (
        <ReviewStep
          type="work"
          accent={accent}
          accentDark={accentDark}
          title={workTitle}
          routeLabel={workArea}
          scheduleLabel={formatScheduleEntries(workScheduleEntries)}
          metaLabel={formatCategories(workTaskCategories)}
          detailLabel={formatHourlyPay(workPay)}
        />
      )
    ) : branchStepIndex === 0 ? (
      <RideRouteStep
        departure={departure}
        destination={destination}
        accent={accent}
        onOpenPlacePicker={setPlacePickerTarget}
      />
    ) : branchStepIndex === 1 ? (
      <RideScheduleStep
        selectedDays={rideDays}
        startTime={rideStartTime}
        endTime={rideEndTime}
        schedules={rideScheduleEntries}
        tag={rideTag}
        accent={accent}
        accentDark={accentDark}
        onToggleDay={toggleRideDay}
        onChangeStartTime={(value) => setRideStartTime(formatTimeInput(value))}
        onChangeEndTime={(value) => setRideEndTime(formatTimeInput(value))}
        onCommitStartTime={() =>
          setRideStartTime((current) => commitTimeInput(current))
        }
        onCommitEndTime={() =>
          setRideEndTime((current) => commitTimeInput(current))
        }
        onAddSchedule={handleAddRideSchedule}
        onRemoveSchedule={handleRemoveRideSchedule}
        onChangeTag={setRideTag}
      />
    ) : branchStepIndex === 2 ? (
      <RideTitleStep
        title={rideTitle}
        capacity={rideCapacity}
        accent={accent}
        onChangeTitle={setRideTitle}
        onChangeCapacity={setRideCapacity}
      />
    ) : branchStepIndex === 3 ? (
      <DetailsStep
        type="ride"
        details={rideDetails}
        agreements={agreements}
        accent={accent}
        accentDark={accentDark}
        onChangeDetails={setRideDetails}
        onToggleAgreement={toggleAgreement}
      />
    ) : (
      <ReviewStep
        type="ride"
        accent={accent}
        accentDark={accentDark}
        title={rideTitle}
        routeLabel={`${departure} → ${destination}`}
        scheduleLabel={formatScheduleEntries(rideScheduleEntries)}
        metaLabel={rideTag}
        detailLabel={`${rideCapacity}명`}
      />
    );

  const buttonLabel =
    submitting
      ? "등록 중..."
      : selectedType === "work" && screenIndex === 5
      ? "인재 풀 등록"
      : selectedType === "ride" && screenIndex === 5
        ? "라이드 모집 시작하기"
        : "다음";
  const canPressNext = isValid && !submitting;

  if (placePickerTarget !== null) {
    return (
      <PlacePickerScreen
        target={placePickerTarget}
        accent={accent}
        currentValue={
          placePickerTarget === "departure"
            ? departure
            : placePickerTarget === "destination"
              ? destination
              : workArea
        }
        topInset={topInset}
        onBack={() => setPlacePickerTarget(null)}
        onSelectPlace={handleSelectPlace}
      />
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.screen} testID="recruitment-create-screen">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingTop: 28 + topInset, paddingBottom: 126 + bottomInset },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          testID="recruitment-create-scroll"
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전"
              onPress={handleBack}
              testID="recruitment-back"
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <ChevronLeft size={22} color={colors.black} strokeWidth={2.5} />
            </Pressable>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: accent },
                ]}
              />
            </View>
          </View>

          {content}
          {submitError ? (
            <Text style={styles.submitError} accessibilityRole="alert">
              {submitError}
            </Text>
          ) : null}
        </ScrollView>

        <View
          style={[styles.footer, { bottom: 34 + bottomInset }]}
          testID="recruitment-footer"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={buttonLabel}
            accessibilityState={{ disabled: !canPressNext }}
            disabled={!canPressNext}
            onPress={() => {
              void handleNext();
            }}
            testID="recruitment-next"
            style={({ pressed }) => [
              styles.footerButton,
              canPressNext
                ? { backgroundColor: accent }
                : styles.footerButtonDisabled,
              pressed && canPressNext && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.footerButtonText,
                canPressNext
                  ? styles.footerButtonTextActive
                  : styles.footerButtonTextDisabled,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {buttonLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type TypeSelectionStepProps = {
  selectedType: RecruitmentType | null;
  onSelect: (type: RecruitmentType) => void;
};

function TypeSelectionStep({ selectedType, onSelect }: TypeSelectionStepProps) {
  return (
    <View style={styles.stepBlock}>
      <ScreenTitle>어떤 모집을 시작할까요?</ScreenTitle>

      <View style={styles.typeList}>
        <TypeCard
          type="ride"
          title="정기 라이딩"
          description="함께 출퇴근하거나 등하교해요"
          selected={selectedType === "ride"}
          accent={colors.mint}
          accentDark={colors.mintDark}
          accentLight={colors.mintLight}
          icon={MapPin}
          onPress={() => onSelect("ride")}
        />
        <TypeCard
          type="work"
          title="인재 풀 등록"
          description="나의 가능한 업무와 선호 근무 시간을 마을 사장님들께 알려요"
          selected={selectedType === "work"}
          accent={colors.yellow}
          accentDark={colors.yellowText}
          accentLight={colors.yellowLight}
          icon={BriefcaseBusiness}
          onPress={() => onSelect("work")}
        />
      </View>
    </View>
  );
}

type TypeCardProps = {
  type: RecruitmentType;
  title: string;
  description: string;
  selected: boolean;
  accent: string;
  accentDark: string;
  accentLight: string;
  icon: LucideIcon;
  onPress: () => void;
};

function TypeCard({
  type,
  title,
  description,
  selected,
  accent,
  accentDark,
  accentLight,
  icon: Icon,
  onPress,
}: TypeCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={`recruitment-type-${type}`}
      style={({ pressed }) => [
        styles.typeCard,
        selected && {
          backgroundColor: accentLight,
          borderColor: accent,
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.typeIconFrame,
          { backgroundColor: selected ? accent : colors.surface },
        ]}
      >
        <Icon
          size={17}
          color={selected ? colors.surface : accentDark}
          strokeWidth={2.4}
        />
      </View>
      <View style={styles.typeCopy}>
        <Text
          style={styles.typeTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          maxFontSizeMultiplier={1.08}
        >
          {title}
        </Text>
        <Text
          style={styles.typeDescription}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.86}
          maxFontSizeMultiplier={1.08}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

type RideRouteStepProps = {
  departure: string;
  destination: string;
  accent: string;
  onOpenPlacePicker: (target: RoutePlaceTarget) => void;
};

function RideRouteStep({
  departure,
  destination,
  accent,
  onOpenPlacePicker,
}: RideRouteStepProps) {
  return (
    <View style={styles.stepBlock}>
      <ScreenTitle>어디로 떠나시나요?</ScreenTitle>
      <PlaceSelectField
        label="출발지"
        placeholder="출발지 선택"
        value={departure}
        accent={accent}
        testID="place-field-departure"
        onPress={() => onOpenPlacePicker("departure")}
      />
      <PlaceSelectField
        label="목적지"
        placeholder="목적지 선택"
        value={destination}
        accent={accent}
        testID="place-field-destination"
        onPress={() => onOpenPlacePicker("destination")}
      />
    </View>
  );
}

type RideScheduleStepProps = {
  selectedDays: string[];
  startTime: string;
  endTime: string;
  schedules: ScheduleEntry[];
  tag: string;
  accent: string;
  accentDark: string;
  onToggleDay: (day: string) => void;
  onChangeStartTime: (value: string) => void;
  onChangeEndTime: (value: string) => void;
  onCommitStartTime: () => void;
  onCommitEndTime: () => void;
  onAddSchedule: () => void;
  onRemoveSchedule: (entryId: string) => void;
  onChangeTag: (value: string) => void;
};

function RideScheduleStep({
  selectedDays,
  startTime,
  endTime,
  schedules,
  tag,
  accent,
  accentDark,
  onToggleDay,
  onChangeStartTime,
  onChangeEndTime,
  onCommitStartTime,
  onCommitEndTime,
  onAddSchedule,
  onRemoveSchedule,
  onChangeTag,
}: RideScheduleStepProps) {
  return (
    <View style={styles.stepBlock}>
      <ScreenTitle>언제 출발하시나요?</ScreenTitle>
      <ScheduleEditor
        selectedDays={selectedDays}
        startTime={startTime}
        endTime={endTime}
        schedules={schedules}
        accent={accent}
        onToggleDay={onToggleDay}
        onChangeStartTime={onChangeStartTime}
        onChangeEndTime={onChangeEndTime}
        onCommitStartTime={onCommitStartTime}
        onCommitEndTime={onCommitEndTime}
        onAddSchedule={onAddSchedule}
        onRemoveSchedule={onRemoveSchedule}
        addTestID="ride-schedule-add"
      />
      <FieldInput
        label="모집 성격"
        placeholder="카테고리 입력"
        value={tag}
        onChangeText={onChangeTag}
        prefix="#"
        accent={accentDark}
      />
    </View>
  );
}

type RideTitleStepProps = {
  title: string;
  capacity: string;
  accent: string;
  onChangeTitle: (value: string) => void;
  onChangeCapacity: (value: string) => void;
};

function RideTitleStep({
  title,
  capacity,
  accent,
  onChangeTitle,
  onChangeCapacity,
}: RideTitleStepProps) {
  return (
    <View style={styles.stepBlock}>
      <ScreenTitle>모집글의 제목을 정해주세요.</ScreenTitle>
      <FieldInput
        label="모집글 제목"
        placeholder="제목 입력"
        value={title}
        onChangeText={onChangeTitle}
        icon={FileText}
        accent={accent}
      />
      <FieldInput
        label="모집 인원"
        placeholder="모집 인원 입력"
        value={capacity}
        onChangeText={onChangeCapacity}
        keyboardType="number-pad"
        suffix="명"
        accent={accent}
      />
      <Text style={styles.helperText}>나를 포함한 총 인원을 숫자로 입력해 주세요.</Text>
    </View>
  );
}

type WorkBasicsStepProps = {
  title: string;
  selectedCategories: string[];
  accent: string;
  accentDark: string;
  accentLight: string;
  onChangeTitle: (value: string) => void;
  onToggleCategory: (value: string) => void;
};

function WorkBasicsStep({
  title,
  selectedCategories,
  accent,
  accentDark,
  accentLight,
  onChangeTitle,
  onToggleCategory,
}: WorkBasicsStepProps) {
  return (
    <View style={styles.stepBlock}>
      <ScreenTitle>어떤 일을 할 수 있나요?</ScreenTitle>
      <FieldInput
        label="소개 제목"
        placeholder="나를 소개하는 제목"
        value={title}
        onChangeText={onChangeTitle}
        icon={FileText}
        accent={accent}
      />

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>가능 업무</Text>
        <View style={styles.categoryGrid}>
          {workCategories.map((item) => {
            const selected = selectedCategories.includes(item);
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={item}
                accessibilityState={{ selected }}
                onPress={() => onToggleCategory(item)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  selected && {
                    borderColor: accent,
                    backgroundColor: accentLight,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.categoryLabel,
                    selected && { color: accentDark, fontFamily: typography.family.bold },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

type WorkAreaStepProps = {
  area: string;
  accent: string;
  onOpenPlacePicker: () => void;
};

function WorkAreaStep({
  area,
  accent,
  onOpenPlacePicker,
}: WorkAreaStepProps) {
  return (
    <View style={styles.stepBlock}>
      <ScreenTitle>활동 가능한 지역을 선택해주세요.</ScreenTitle>
      <PlaceSelectField
        label="활동 가능 지역"
        placeholder="지역 선택"
        value={area}
        accent={accent}
        testID="place-field-work-area"
        onPress={onOpenPlacePicker}
      />
    </View>
  );
}

type WorkScheduleStepProps = {
  selectedDays: string[];
  startTime: string;
  endTime: string;
  schedules: ScheduleEntry[];
  pay: string;
  accent: string;
  accentDark: string;
  onToggleDay: (day: string) => void;
  onChangeStartTime: (value: string) => void;
  onChangeEndTime: (value: string) => void;
  onCommitStartTime: () => void;
  onCommitEndTime: () => void;
  onAddSchedule: () => void;
  onRemoveSchedule: (entryId: string) => void;
  onChangePay: (value: string) => void;
};

function WorkScheduleStep({
  selectedDays,
  startTime,
  endTime,
  schedules,
  pay,
  accent,
  accentDark,
  onToggleDay,
  onChangeStartTime,
  onChangeEndTime,
  onCommitStartTime,
  onCommitEndTime,
  onAddSchedule,
  onRemoveSchedule,
  onChangePay,
}: WorkScheduleStepProps) {
  return (
    <View style={styles.stepBlock}>
      <ScreenTitle>가능한 시간대를 알려주세요.</ScreenTitle>
      <ScheduleEditor
        selectedDays={selectedDays}
        startTime={startTime}
        endTime={endTime}
        schedules={schedules}
        accent={accent}
        onToggleDay={onToggleDay}
        onChangeStartTime={onChangeStartTime}
        onChangeEndTime={onChangeEndTime}
        onCommitStartTime={onCommitStartTime}
        onCommitEndTime={onCommitEndTime}
        onAddSchedule={onAddSchedule}
        onRemoveSchedule={onRemoveSchedule}
        addTestID="work-schedule-add"
      />

      <FieldInput
        label="시간당 희망 급여"
        placeholder="희망 급여"
        value={pay}
        onChangeText={onChangePay}
        keyboardType="number-pad"
        prefix="시간당"
        suffix="원"
        accent={accentDark}
      />
    </View>
  );
}

type ScheduleEditorProps = {
  selectedDays: string[];
  startTime: string;
  endTime: string;
  schedules: ScheduleEntry[];
  accent: string;
  addTestID: string;
  onToggleDay: (day: string) => void;
  onChangeStartTime: (value: string) => void;
  onChangeEndTime: (value: string) => void;
  onCommitStartTime: () => void;
  onCommitEndTime: () => void;
  onAddSchedule: () => void;
  onRemoveSchedule: (entryId: string) => void;
};

function ScheduleEditor({
  selectedDays,
  startTime,
  endTime,
  schedules,
  accent,
  addTestID,
  onToggleDay,
  onChangeStartTime,
  onChangeEndTime,
  onCommitStartTime,
  onCommitEndTime,
  onAddSchedule,
  onRemoveSchedule,
}: ScheduleEditorProps) {
  const canAddSchedule =
    selectedDays.length > 0 && hasText(startTime) && hasText(endTime);

  return (
    <View style={styles.scheduleEditor}>
      <DaySelector
        selectedDays={selectedDays}
        accent={accent}
        onToggleDay={onToggleDay}
      />

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>가능 시간</Text>
        <View style={styles.inputRow}>
          <Clock3
            size={17}
            color={startTime || endTime ? accent : colors.gray300}
            strokeWidth={2.3}
          />
          <TextInput
            accessibilityLabel="시작 시간"
            placeholder="시작 시간"
            placeholderTextColor={colors.gray300}
            value={startTime}
            onChangeText={onChangeStartTime}
            onBlur={onCommitStartTime}
            keyboardType="number-pad"
            style={[styles.timeInput, hasText(startTime) && styles.inputActiveText]}
          />
          <Text style={styles.rangeText}>~</Text>
          <TextInput
            accessibilityLabel="종료 시간"
            placeholder="종료 시간"
            placeholderTextColor={colors.gray300}
            value={endTime}
            onChangeText={onChangeEndTime}
            onBlur={onCommitEndTime}
            keyboardType="number-pad"
            style={[styles.timeInput, hasText(endTime) && styles.inputActiveText]}
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="일정 추가"
        accessibilityState={{ disabled: !canAddSchedule }}
        disabled={!canAddSchedule}
        onPress={onAddSchedule}
        testID={addTestID}
        style={({ pressed }) => [
          styles.scheduleAddButton,
          { borderColor: canAddSchedule ? accent : colors.gray100 },
          !canAddSchedule && styles.scheduleAddButtonDisabled,
          pressed && canAddSchedule && styles.pressed,
        ]}
      >
        <Plus
          size={16}
          color={canAddSchedule ? colors.black : colors.gray300}
          strokeWidth={2.5}
        />
        <Text
          style={[
            styles.scheduleAddText,
            !canAddSchedule && styles.scheduleAddTextDisabled,
          ]}
        >
          추가
        </Text>
      </Pressable>

      {schedules.length > 0 ? (
        <View style={styles.scheduleList}>
          {sortScheduleEntries(schedules).map((entry) => {
            const label = formatScheduleEntry(entry);

            return (
              <View
                key={entry.id}
                style={[styles.scheduleItem, { borderColor: accent }]}
              >
                <Text style={styles.scheduleItemText}>{label}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${label} 삭제`}
                  onPress={() => onRemoveSchedule(entry.id)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.scheduleRemoveButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <X size={14} color={colors.grayIcon} strokeWidth={2.4} />
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

type DetailsStepProps = {
  type: RecruitmentType;
  details: string;
  agreements: Agreements;
  accent: string;
  accentDark: string;
  onChangeDetails: (value: string) => void;
  onToggleAgreement: (id: AgreementId) => void;
};

function DetailsStep({
  type,
  details,
  agreements,
  accent,
  accentDark,
  onChangeDetails,
  onToggleAgreement,
}: DetailsStepProps) {
  return (
    <View style={styles.stepBlock}>
      <ScreenTitle>
        {type === "ride"
          ? "어떤 라이드를 원하시나요?"
          : "가능 업무와 연락 전 참고사항을 알려주세요."}
      </ScreenTitle>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>상세 설명</Text>
        <TextInput
          accessibilityLabel="상세 설명"
          multiline
          placeholder="상세설명을 써주세요"
          placeholderTextColor={colors.gray300}
          value={details}
          onChangeText={onChangeDetails}
          style={[
            styles.textArea,
            hasText(details) && {
              color: colors.black,
              borderColor: accent,
              backgroundColor: colors.surface,
            },
          ]}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.agreementList}>
        {agreementItems.map((item) => {
          const checked = agreements[item.id];
          return (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityLabel={item.label}
              accessibilityState={{ checked }}
              onPress={() => onToggleAgreement(item.id)}
              style={({ pressed }) => [
                styles.agreementRow,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  checked && {
                    backgroundColor: accent,
                    borderColor: accent,
                  },
                ]}
              >
                {checked ? (
                  <Check size={12} color={colors.surface} strokeWidth={3} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.agreementText,
                  checked && { color: accentDark },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type ReviewStepProps = {
  type: RecruitmentType;
  accent: string;
  accentDark: string;
  title: string;
  routeLabel: string;
  scheduleLabel: string;
  metaLabel: string;
  detailLabel: string;
};

function ReviewStep({
  type,
  accent,
  accentDark,
  title,
  routeLabel,
  scheduleLabel,
  metaLabel,
  detailLabel,
}: ReviewStepProps) {
  return (
    <View style={styles.stepBlock}>
      <ScreenTitle>마지막으로 확인해주세요.</ScreenTitle>

      <View style={[styles.reviewCard, { borderColor: accent }]}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle} numberOfLines={2}>
            {title}
          </Text>
          <View style={[styles.reviewBadge, { backgroundColor: accent }]}>
            <Text style={styles.reviewBadgeText}>
              {type === "ride" ? "라이드" : "인적 자원"}
            </Text>
          </View>
        </View>

        <ReviewRow icon={MapPin} color={accentDark} label={routeLabel} />
        <ReviewRow icon={Clock3} color={colors.grayIcon} label={scheduleLabel} />
        <ReviewRow
          icon={type === "ride" ? FileText : BriefcaseBusiness}
          color={colors.grayIcon}
          label={metaLabel}
        />
        <ReviewRow icon={Check} color={colors.grayIcon} label={detailLabel} />
      </View>
    </View>
  );
}

type ReviewRowProps = {
  icon: LucideIcon;
  color: string;
  label: string;
};

function ReviewRow({ icon: Icon, color, label }: ReviewRowProps) {
  return (
    <View style={styles.reviewRow}>
      <View style={styles.reviewIconFrame}>
        <Icon size={15} color={color} strokeWidth={2.4} />
      </View>
      <Text style={[styles.reviewMeta, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

type PlacePickerScreenProps = {
  target: PlacePickerTarget;
  accent: string;
  currentValue: string;
  topInset: number;
  onBack: () => void;
  onSelectPlace: (place: PlaceCandidate) => void;
};

function PlacePickerScreen({
  target,
  accent,
  currentValue,
  topInset,
  onBack,
  onSelectPlace,
}: PlacePickerScreenProps) {
  const [query, setQuery] = useState(currentValue);
  const [places, setPlaces] = useState<PlaceCandidate[]>([]);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [placeSearchError, setPlaceSearchError] = useState<string | null>(null);
  const title =
    target === "departure"
      ? "지도에서 출발지 선택"
      : target === "destination"
        ? "지도에서 목적지 선택"
        : "지도에서 활동 가능 지역 선택";

  useEffect(() => {
    let active = true;
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setPlaces([]);
      setPlaceSearchError(null);
      setIsSearchingPlace(false);
      return () => {
        active = false;
      };
    }

    setIsSearchingPlace(true);
    setPlaceSearchError(null);

    searchApiPlaceCandidates(trimmedQuery)
      .then((apiPlaces) => {
        if (!active) {
          return;
        }

        setPlaceSearchError(null);
        setPlaces(apiPlaces);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setPlaces([]);
        setPlaceSearchError(
          error instanceof Error
            ? "지도 API 검색에 실패했어요. 잠시 후 다시 검색해주세요."
            : "지도 API 검색에 실패했어요. 잠시 후 다시 검색해주세요.",
        );
      })
      .finally(() => {
        if (active) {
          setIsSearchingPlace(false);
        }
      });

    return () => {
      active = false;
    };
  }, [query]);

  const firstPlace = places[0];
  const firstPlaceCamera = firstPlace
    ? {
        latitude: firstPlace.latitude,
        longitude: firstPlace.longitude,
        zoom: 16,
      }
    : undefined;
  const canSelectMapCenter = Boolean(firstPlace);
  const helperText =
    query.trim().length < 2
      ? "장소명을 2글자 이상 입력하면 지도 API 결과가 표시돼요."
      : isSearchingPlace
        ? "지도 API에서 장소를 찾는 중이에요."
        : places.length === 0 && !placeSearchError
          ? "검색 결과가 없어요."
          : null;

  return (
    <View style={styles.safeArea}>
      <View style={styles.screen} testID="place-picker-screen">
        <View style={[styles.placeHeader, { paddingTop: 28 + topInset }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전"
            onPress={onBack}
            testID="place-picker-back"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ChevronLeft size={22} color={colors.black} strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.placeTitle}>{title}</Text>
        </View>

        <View style={styles.placeSearchRow}>
          <Search size={18} color={colors.gray400} strokeWidth={2.3} />
          <TextInput
            accessibilityLabel="장소 검색"
            placeholder="장소 검색"
            placeholderTextColor={colors.gray300}
            value={query}
            onChangeText={setQuery}
            style={styles.placeSearchInput}
          />
        </View>

        <View
          style={styles.placeMapFrame}
          testID="place-map-frame"
          accessibilityValue={{ text: firstPlace?.name ?? "검색 결과 없음" }}
        >
          <MapPreview style={styles.placeMap} camera={firstPlaceCamera} />
          <View style={[styles.placeMapPin, { backgroundColor: accent }]}>
            <MapPin size={24} color={colors.surface} strokeWidth={2.4} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSelectMapCenter }}
          accessibilityLabel="지도 중심 선택"
          disabled={!canSelectMapCenter}
          onPress={() => {
            if (firstPlace) {
              onSelectPlace(firstPlace);
            }
          }}
          testID="place-select-map-center"
          style={({ pressed }) => [
            styles.mapCenterButton,
            { backgroundColor: accent },
            !canSelectMapCenter && styles.mapCenterButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.mapCenterButtonText}>지도 중심 선택</Text>
        </Pressable>

        <ScrollView
          style={styles.placeListScroll}
          contentContainerStyle={styles.placeList}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>지도 API 결과</Text>
          {placeSearchError ? (
            <Text style={styles.placeSearchError}>
              {placeSearchError}
            </Text>
          ) : null}
          {helperText ? (
            <Text style={styles.placeSearchHelper}>{helperText}</Text>
          ) : null}
          {places.map((place) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              accessibilityLabel={`${place.name} 선택`}
              onPress={() => onSelectPlace(place)}
              testID={`place-result-${place.id}`}
              style={({ pressed }) => [
                styles.placeResultRow,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.placeResultIcon, { borderColor: accent }]}>
                <MapPin size={16} color={accent} strokeWidth={2.4} />
              </View>
              <View style={styles.placeResultCopy}>
                <Text style={styles.placeResultName}>{place.name}</Text>
                <Text style={styles.placeResultAddress} numberOfLines={1}>
                  {place.address}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

type PlaceSelectFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  accent: string;
  testID: string;
  onPress: () => void;
};

function PlaceSelectField({
  label,
  placeholder,
  value,
  accent,
  testID,
  onPress,
}: PlaceSelectFieldProps) {
  const filled = hasText(value);

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [
          styles.inputRow,
          filled && {
            borderColor: accent,
            backgroundColor: colors.surface,
          },
          pressed && styles.pressed,
        ]}
      >
        <MapPin
          size={17}
          color={filled ? accent : colors.gray300}
          strokeWidth={2.3}
        />
        <Text
          style={[
            styles.placeFieldText,
            filled && styles.inputActiveText,
          ]}
          numberOfLines={1}
        >
          {filled ? value : placeholder}
        </Text>
      </Pressable>
    </View>
  );
}

type DaySelectorProps = {
  selectedDays: string[];
  accent: string;
  onToggleDay: (day: string) => void;
};

function DaySelector({ selectedDays, accent, onToggleDay }: DaySelectorProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>요일 선택</Text>
      <View style={styles.dayRow}>
        {weekdays.map((day) => {
          const selected = selectedDays.includes(day);
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={`${day}요일`}
              accessibilityState={{ selected }}
              onPress={() => onToggleDay(day)}
              style={({ pressed }) => [
                styles.dayCircle,
                selected && { backgroundColor: accent },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  selected && styles.dayLabelSelected,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                maxFontSizeMultiplier={1}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type FieldInputProps = {
  label: string;
  placeholder: string;
  value: string;
  accent: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  icon?: LucideIcon;
  prefix?: string;
  suffix?: string;
  keyboardType?: KeyboardTypeOptions;
};

function FieldInput({
  label,
  placeholder,
  value,
  accent,
  onChangeText,
  onBlur,
  icon: Icon,
  prefix,
  suffix,
  keyboardType,
}: FieldInputProps) {
  const filled = hasText(value);

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          filled && {
            borderColor: accent,
            backgroundColor: colors.surface,
          },
        ]}
      >
        {Icon ? (
          <Icon
            size={17}
            color={filled ? accent : colors.gray300}
            strokeWidth={2.3}
          />
        ) : null}
        {prefix ? (
          <Text style={[styles.prefixText, filled && { color: accent }]}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.gray300}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          keyboardType={keyboardType}
          style={[styles.textInput, filled && styles.inputActiveText]}
        />
        {suffix ? <Text style={styles.suffixText}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function hasText(value: string) {
  return value.trim().length > 0;
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function createScheduleEntry(
  days: string[],
  startTime: string,
  endTime: string,
  index: number,
): ScheduleEntry | null {
  const committedStartTime = commitTimeInput(startTime);
  const committedEndTime = commitTimeInput(endTime);
  const sortedDays = sortWeekdays(days);

  if (
    sortedDays.length === 0 ||
    !hasText(committedStartTime) ||
    !hasText(committedEndTime)
  ) {
    return null;
  }

  return {
    id: `schedule-${index}-${sortedDays.join("")}-${committedStartTime}-${committedEndTime}`,
    days: sortedDays,
    startTime: committedStartTime,
    endTime: committedEndTime,
  };
}

function getScheduleEntryDays(entries: ScheduleEntry[]) {
  const selectedDays = new Set<string>();

  for (const entry of entries) {
    for (const day of entry.days) {
      selectedDays.add(day);
    }
  }

  return weekdays.filter((day) => selectedDays.has(day));
}

function formatScheduleEntry(entry: ScheduleEntry) {
  return `${sortWeekdays(entry.days).join(" · ")} ${entry.startTime} - ${entry.endTime}`;
}

function formatScheduleEntries(entries: ScheduleEntry[]) {
  return entries.length > 0
    ? sortScheduleEntries(entries)
        .map((entry) => formatScheduleEntry(entry))
        .join(" · ")
    : "시간 미정";
}

function sortWeekdays(days: readonly string[]): string[] {
  return [...days].sort(
    (firstDay, secondDay) =>
      getWeekdayOrder(firstDay) - getWeekdayOrder(secondDay),
  );
}

function sortScheduleEntries(entries: readonly ScheduleEntry[]): ScheduleEntry[] {
  return [...entries].sort((firstEntry, secondEntry) => {
    const firstDayDiff =
      getFirstScheduleDayOrder(firstEntry) -
      getFirstScheduleDayOrder(secondEntry);

    if (firstDayDiff !== 0) {
      return firstDayDiff;
    }

    const startTimeDiff = firstEntry.startTime.localeCompare(secondEntry.startTime);

    if (startTimeDiff !== 0) {
      return startTimeDiff;
    }

    return firstEntry.endTime.localeCompare(secondEntry.endTime);
  });
}

function getFirstScheduleDayOrder(entry: ScheduleEntry): number {
  return sortWeekdays(entry.days).reduce<number>(
    (minimumOrder, day) => Math.min(minimumOrder, getWeekdayOrder(day)),
    unknownWeekdayOrder,
  );
}

function getWeekdayOrder(day: string): number {
  return weekdayOrder.get(day) ?? unknownWeekdayOrder;
}

function formatCategories(categories: string[]) {
  return categories.length > 0 ? categories.join(" · ") : "가능 업무";
}

function formatCurrency(value: string) {
  const numeric = value.replace(/[^0-9]/g, "");
  if (!numeric) {
    return "";
  }

  return Number(numeric).toLocaleString("ko-KR");
}

function parseCurrencyNumber(value: string) {
  const numeric = value.replace(/[^0-9]/g, "");

  return numeric ? Number(numeric) : undefined;
}

function formatHourlyPay(value: string) {
  const amount = formatCurrency(value);

  return amount ? `시간당 ${amount}원` : "시간당 협의";
}

function formatTimeInput(value: string) {
  const numeric = value.replace(/[^0-9]/g, "").slice(0, 4);

  if (numeric.length <= 3) {
    return numeric;
  }

  return `${numeric.slice(0, 2)}:${numeric.slice(2)}`;
}

function commitTimeInput(value: string) {
  const numeric = value.replace(/[^0-9]/g, "").slice(0, 4);

  if (numeric.length <= 2) {
    return numeric;
  }

  const padded = numeric.length === 3 ? numeric.padStart(4, "0") : numeric;
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 30,
  },
  submitError: {
    color: colors.red,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "center",
  },
  header: {
    gap: 18,
  },
  backButton: {
    width: 34,
    height: 34,
    marginLeft: -7,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.gray100,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  stepBlock: {
    gap: 28,
  },
  placeHeader: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  placeTitle: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  placeSearchRow: {
    height: 56,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  placeSearchInput: {
    flex: 1,
    minWidth: 0,
    height: 46,
    padding: 0,
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  placeMapFrame: {
    height: 270,
    marginTop: 16,
    overflow: "hidden",
    backgroundColor: colors.mapBase,
  },
  placeMap: {
    width: "100%",
    height: "100%",
  },
  placeMapPin: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -34,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
  },
  mapCenterButton: {
    height: 52,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCenterButtonDisabled: {
    backgroundColor: colors.gray300,
    opacity: 0.72,
  },
  mapCenterButtonText: {
    color: colors.surface,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  placeListScroll: {
    flex: 1,
    marginTop: 16,
  },
  placeList: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    gap: 8,
  },
  placeResultRow: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  placeResultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  placeResultCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  typeList: {
    gap: 10,
  },
  typeCard: {
    minHeight: 112,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray50,
    backgroundColor: colors.gray50,
    justifyContent: "center",
    gap: 12,
  },
  typeIconFrame: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  typeCopy: {
    minWidth: 0,
    gap: 6,
  },
  typeTitle: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  typeDescription: {
    color: colors.gray400,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  fieldBlock: {
    gap: 8,
  },
  scheduleEditor: {
    gap: 12,
  },
  label: {
    color: colors.gray400,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    letterSpacing: 0.4,
  },
  inputRow: {
    minHeight: 64,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray50,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    height: 48,
    padding: 0,
    color: colors.gray300,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  inputActiveText: {
    color: colors.black,
  },
  placeFieldText: {
    flex: 1,
    minWidth: 0,
    color: colors.gray300,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  placeResultName: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  placeResultAddress: {
    color: colors.gray400,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  placeSearchError: {
    color: colors.red,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  placeSearchHelper: {
    color: colors.gray400,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  prefixText: {
    color: colors.gray300,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  suffixText: {
    color: colors.slate,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  helperText: {
    marginTop: -18,
    color: colors.mintDark,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dayCircle: {
    flex: 1,
    minWidth: 0,
    maxWidth: 44,
    aspectRatio: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray50,
  },
  dayLabel: {
    color: colors.grayIcon,
    fontFamily: typography.family.regular,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    textAlign: "center",
  },
  dayLabelSelected: {
    color: colors.surface,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    width: 98,
    minHeight: 32,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray100,
    backgroundColor: colors.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    color: colors.grayIcon,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: 14,
    textAlign: "center",
  },
  timeInput: {
    flex: 1,
    minWidth: 0,
    height: 40,
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderRadius: 6,
    backgroundColor: colors.gray100,
    color: colors.gray300,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    textAlign: "center",
  },
  rangeText: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  scheduleAddButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  scheduleAddButtonDisabled: {
    backgroundColor: colors.gray50,
  },
  scheduleAddText: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  scheduleAddTextDisabled: {
    color: colors.gray300,
  },
  scheduleList: {
    gap: 8,
  },
  scheduleItem: {
    minHeight: 46,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scheduleItemText: {
    flex: 1,
    minWidth: 0,
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  scheduleRemoveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  textArea: {
    minHeight: 170,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray50,
    backgroundColor: colors.gray50,
    color: colors.gray300,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  agreementList: {
    marginTop: 22,
    gap: 9,
  },
  agreementRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  agreementText: {
    flex: 1,
    color: colors.gray400,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  reviewCard: {
    width: "100%",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: colors.surface,
    gap: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  reviewTitle: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  reviewBadge: {
    minWidth: 42,
    minHeight: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewBadgeText: {
    color: colors.surface,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: 14,
  },
  reviewRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  reviewIconFrame: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray50,
  },
  reviewMeta: {
    flex: 1,
    minWidth: 0,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  footer: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  footerButton: {
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  footerButtonDisabled: {
    backgroundColor: colors.gray100,
  },
  footerButtonText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    textAlign: "center",
  },
  footerButtonTextActive: {
    color: colors.surface,
  },
  footerButtonTextDisabled: {
    color: colors.gray400,
  },
  pressed: {
    opacity: 0.78,
  },
});
