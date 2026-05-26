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
  Search,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { MapPreview } from "../components/MapPreview";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { createPost } from "../services/api";
import { searchPlaceCandidates as searchApiPlaceCandidates } from "../services/places";
import type { Post, Weekday } from "../types/domain";
import type { PlaceCandidate } from "../types/place";

type RecruitmentType = "ride" | "work";
type RoutePlaceTarget = "departure" | "destination";

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

const weekdays = ["월", "화", "수", "목", "금", "토", "일"] as const;

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

const fallbackPlaceCandidates: PlaceCandidate[] = [
  {
    id: "cheongdo-station",
    name: "청도역",
    address: "경북 청도군 청도읍 청화로",
    latitude: 35.6474,
    longitude: 128.7338,
    source: "fallback",
  },
  {
    id: "daejeon-station",
    name: "대전역",
    address: "대전 동구 중앙로 215",
    latitude: 36.3324,
    longitude: 127.4346,
    source: "fallback",
  },
  {
    id: "dairuri-cafe",
    name: "다로리 카페",
    address: "다로리로 12",
    latitude: 37.5572,
    longitude: 126.9246,
    source: "fallback",
  },
  {
    id: "central-stop",
    name: "중앙 정류장",
    address: "중앙대로 버스정류장",
    latitude: 37.5591,
    longitude: 126.9272,
    source: "fallback",
  },
];

export function CreateRecruitmentScreen({
  onCancel,
  onComplete,
}: CreateRecruitmentScreenProps) {
  const [screenIndex, setScreenIndex] = useState(0);
  const [selectedType, setSelectedType] = useState<RecruitmentType | null>(null);
  const [placePickerTarget, setPlacePickerTarget] =
    useState<RoutePlaceTarget | null>(null);

  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [rideDays, setRideDays] = useState<string[]>([]);
  const [rideTime, setRideTime] = useState("");
  const [rideTag, setRideTag] = useState("");
  const [rideTitle, setRideTitle] = useState("");
  const [rideCapacity, setRideCapacity] = useState("");
  const [rideDetails, setRideDetails] = useState("");

  const [workTitle, setWorkTitle] = useState("");
  const [workTaskCategories, setWorkTaskCategories] = useState<string[]>([]);
  const [workDays, setWorkDays] = useState<string[]>([]);
  const [workStartTime, setWorkStartTime] = useState("");
  const [workEndTime, setWorkEndTime] = useState("");
  const [workPay, setWorkPay] = useState("");
  const [workDetails, setWorkDetails] = useState("");

  const [agreements, setAgreements] = useState<Agreements>(initialAgreements);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const accent = selectedType === "work" ? colors.yellow : colors.mint;
  const accentDark = selectedType === "work" ? colors.yellowText : colors.mintDark;
  const accentLight = selectedType === "work" ? colors.yellowLight : colors.mintLight;
  const branchStepIndex = screenIndex - 1;
  const totalScreens = selectedType === "work" ? 5 : 6;
  const progress = selectedType
    ? Math.min((screenIndex + 1) / totalScreens, 1)
    : 0.22;

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
        return rideDays.length > 0 && hasText(rideTime) && hasText(rideTag);
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
        return (
          workDays.length > 0 &&
          hasText(workStartTime) &&
          hasText(workEndTime) &&
          hasText(workPay)
        );
      }
      if (branchStepIndex === 2) {
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
    rideDays.length,
    rideDetails,
    rideTag,
    rideTime,
    rideTitle,
    screenIndex,
    selectedType,
    workDays.length,
    workDetails,
    workEndTime,
    workPay,
    workStartTime,
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

    if (selectedType === "ride" && branchStepIndex === 1) {
      setRideTime((current) => commitTimeInput(current));
    }

    if (selectedType === "work" && branchStepIndex === 1) {
      setWorkStartTime((current) => commitTimeInput(current));
      setWorkEndTime((current) => commitTimeInput(current));
    }

    const maxIndex = selectedType === "work" ? 4 : 5;
    if (screenIndex === maxIndex) {
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
    if (placePickerTarget === "departure") {
      setDeparture(place.name);
    } else if (placePickerTarget === "destination") {
      setDestination(place.name);
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

  function buildCreatePostInput(type: RecruitmentType): Partial<Post> {
    if (type === "work") {
      const scheduleLabel = formatDays(workDays);

      return {
        type: "job",
        profileMode: "resource",
        title: workTitle.trim(),
        body: workDetails.trim(),
        placeName: "다로리 일대",
        days: workDays as Weekday[],
        startTime: workStartTime,
        endTime: workEndTime,
        wageType: "hourly",
        wageAmount: parseCurrencyNumber(workPay),
        jobCategory: formatCategories(workTaskCategories),
        availableTasks: workTaskCategories,
        employmentTypes: ["partTime", "shortTerm"],
        preferredPay: formatHourlyPay(workPay),
        availabilityNote: `${scheduleLabel} ${workStartTime} - ${workEndTime}`.trim(),
        contactNote: workDetails.trim(),
      };
    }

    return {
      type: "carpool",
      title: rideTitle.trim(),
      body: rideDetails.trim(),
      departure,
      destination,
      days: rideDays as Weekday[],
      startTime: rideTime,
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
        <WorkScheduleStep
          selectedDays={workDays}
          startTime={workStartTime}
          endTime={workEndTime}
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
          onChangePay={(value) => setWorkPay(formatCurrency(value))}
        />
      ) : branchStepIndex === 2 ? (
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
          routeLabel={formatCategories(workTaskCategories)}
          scheduleLabel={formatDays(workDays)}
          metaLabel={`${workStartTime} - ${workEndTime}`}
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
        time={rideTime}
        tag={rideTag}
        accent={accent}
        accentDark={accentDark}
        onToggleDay={toggleRideDay}
        onChangeTime={(value) => setRideTime(formatTimeInput(value))}
        onCommitTime={() => setRideTime((current) => commitTimeInput(current))}
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
        scheduleLabel={`${formatDays(rideDays)} ${rideTime}`.trim()}
        metaLabel={rideTag}
        detailLabel={`${rideCapacity}명`}
      />
    );

  const buttonLabel =
    submitting
      ? "등록 중..."
      : selectedType === "work" && screenIndex === 4
      ? "인적 자원 등록하기"
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
          placePickerTarget === "departure" ? departure : destination
        }
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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

        <View style={styles.footer}>
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
      <Text style={styles.title}>어떤 모집을 시작할까요?</Text>

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
          title="인적 자원"
          description="가능한 업무와 시간을 알려요"
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
        <Text style={styles.typeTitle}>{title}</Text>
        <Text style={styles.typeDescription}>{description}</Text>
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
      <Text style={styles.title}>어디로 떠나시나요?</Text>
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
  time: string;
  tag: string;
  accent: string;
  accentDark: string;
  onToggleDay: (day: string) => void;
  onChangeTime: (value: string) => void;
  onCommitTime: () => void;
  onChangeTag: (value: string) => void;
};

function RideScheduleStep({
  selectedDays,
  time,
  tag,
  accent,
  accentDark,
  onToggleDay,
  onChangeTime,
  onCommitTime,
  onChangeTag,
}: RideScheduleStepProps) {
  return (
    <View style={styles.stepBlock}>
      <Text style={styles.title}>언제 출발하시나요?</Text>
      <DaySelector
        selectedDays={selectedDays}
        accent={accent}
        onToggleDay={onToggleDay}
      />
      <FieldInput
        label="출발 희망 시간"
        placeholder="출발 시간 입력"
        value={time}
        onChangeText={onChangeTime}
        onBlur={onCommitTime}
        icon={Clock3}
        accent={accent}
        keyboardType="number-pad"
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
      <Text style={styles.title}>모집글의 제목을 정해주세요.</Text>
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
      <Text style={styles.title}>어떤 일을 할 수 있나요?</Text>
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
                    selected && { color: accentDark, fontWeight: typography.weight.bold },
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

type WorkScheduleStepProps = {
  selectedDays: string[];
  startTime: string;
  endTime: string;
  pay: string;
  accent: string;
  accentDark: string;
  onToggleDay: (day: string) => void;
  onChangeStartTime: (value: string) => void;
  onChangeEndTime: (value: string) => void;
  onCommitStartTime: () => void;
  onCommitEndTime: () => void;
  onChangePay: (value: string) => void;
};

function WorkScheduleStep({
  selectedDays,
  startTime,
  endTime,
  pay,
  accent,
  accentDark,
  onToggleDay,
  onChangeStartTime,
  onChangeEndTime,
  onCommitStartTime,
  onCommitEndTime,
  onChangePay,
}: WorkScheduleStepProps) {
  return (
    <View style={styles.stepBlock}>
      <Text style={styles.title}>가능한 시간대를 알려주세요.</Text>
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
      <Text style={styles.title}>
        {type === "ride"
          ? "어떤 라이드를 원하시나요?"
          : "가능 업무와 연락 전 참고사항을 알려주세요."}
      </Text>

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
      <Text style={styles.title}>마지막으로 확인해주세요.</Text>

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
  target: RoutePlaceTarget;
  accent: string;
  currentValue: string;
  onBack: () => void;
  onSelectPlace: (place: PlaceCandidate) => void;
};

function PlacePickerScreen({
  target,
  accent,
  currentValue,
  onBack,
  onSelectPlace,
}: PlacePickerScreenProps) {
  const [query, setQuery] = useState(currentValue);
  const [places, setPlaces] = useState<PlaceCandidate[]>(() =>
    getFallbackPlaceCandidates(currentValue),
  );
  const title =
    target === "departure" ? "지도에서 출발지 선택" : "지도에서 목적지 선택";

  useEffect(() => {
    let active = true;
    const fallback = getFallbackPlaceCandidates(query);

    setPlaces(fallback);

    searchApiPlaceCandidates(query).then((apiPlaces) => {
      if (!active || apiPlaces.length === 0) {
        return;
      }

      setPlaces(mergePlaceCandidates(apiPlaces, fallback));
    });

    return () => {
      active = false;
    };
  }, [query]);

  const firstPlace = places[0] ?? fallbackPlaceCandidates[0];

  return (
    <View style={styles.safeArea}>
      <View style={styles.screen} testID="place-picker-screen">
        <View style={styles.placeHeader}>
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

        <View style={styles.placeMapFrame}>
          <MapPreview style={styles.placeMap} />
          <View style={[styles.placeMapPin, { backgroundColor: accent }]}>
            <MapPin size={24} color={colors.surface} strokeWidth={2.4} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="지도 중심 선택"
          onPress={() => onSelectPlace(firstPlace)}
          testID="place-select-map-center"
          style={({ pressed }) => [
            styles.mapCenterButton,
            { backgroundColor: accent },
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

function formatDays(days: string[]) {
  return days.length > 0 ? days.join(" · ") : "요일 미정";
}

function formatCategories(categories: string[]) {
  return categories.length > 0 ? categories.join(" · ") : "가능 업무";
}

function getFallbackPlaceCandidates(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return fallbackPlaceCandidates;
  }

  const filtered = fallbackPlaceCandidates.filter((place) => {
    const searchable = `${place.name} ${place.address}`.toLowerCase();
    return searchable.includes(normalizedQuery);
  });

  return filtered.length > 0 ? filtered : fallbackPlaceCandidates;
}

function mergePlaceCandidates(
  apiPlaces: PlaceCandidate[],
  fallbackPlaces: PlaceCandidate[],
) {
  const seen = new Set<string>();

  return [...apiPlaces, ...fallbackPlaces].filter((place) => {
    const key = `${place.name}-${place.address}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
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
    paddingTop: 28,
    paddingBottom: 126,
    gap: 30,
  },
  submitError: {
    color: colors.red,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
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
  title: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: typography.weight.medium,
  },
  placeHeader: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  placeTitle: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: typography.weight.medium,
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
    fontWeight: typography.weight.medium,
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
  mapCenterButtonText: {
    color: colors.surface,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.medium,
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
    gap: 6,
  },
  typeTitle: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.medium,
  },
  typeDescription: {
    color: colors.gray400,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.medium,
  },
  fieldBlock: {
    gap: 8,
  },
  label: {
    color: colors.gray400,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.medium,
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
    fontWeight: typography.weight.medium,
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
    fontWeight: typography.weight.medium,
  },
  placeResultName: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.medium,
  },
  placeResultAddress: {
    color: colors.gray400,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
  },
  prefixText: {
    color: colors.gray300,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.medium,
  },
  suffixText: {
    color: colors.slate,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.medium,
  },
  helperText: {
    marginTop: -18,
    color: colors.mintDark,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.medium,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray50,
  },
  dayLabel: {
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.regular,
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
    fontSize: 10,
    lineHeight: 14,
    fontWeight: typography.weight.medium,
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
    fontWeight: typography.weight.medium,
    textAlign: "center",
  },
  rangeText: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.medium,
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
    fontWeight: typography.weight.medium,
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
    fontWeight: typography.weight.medium,
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
    fontWeight: typography.weight.bold,
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
    fontSize: 10,
    lineHeight: 14,
    fontWeight: typography.weight.bold,
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
    fontWeight: typography.weight.bold,
  },
  footer: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 34,
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
    fontWeight: typography.weight.medium,
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
