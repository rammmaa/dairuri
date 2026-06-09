import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Header } from "../../components/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { profileLayout } from "./profileLayout";

export type ProfileInfoScreenKind = "notice" | "faq" | "appInfo" | "terms";

export type ProfileInfoScreenProps = {
  kind: ProfileInfoScreenKind;
  onBack?: () => void;
};

const infoContent: Record<
  ProfileInfoScreenKind,
  {
    title: string;
    intro: string;
    sections: { heading: string; body: string }[];
  }
> = {
  notice: {
    title: "공지사항",
    intro: "앱 업데이트와 운영 안내를 확인하세요.",
    sections: [
      {
        heading: "서비스 안내",
        body: "다로링크는 지역 이동과 일손 연결 기능을 안정적으로 제공하기 위해 기능별 업데이트를 순차적으로 적용하고 있어요.",
      },
      {
        heading: "운영 시간",
        body: "문의와 신고 접수는 매일 확인하며, 긴급한 안전 이슈는 채팅방 신고 기능을 먼저 이용해 주세요.",
      },
    ],
  },
  faq: {
    title: "FAQ",
    intro: "자주 묻는 질문을 모아두었어요.",
    sections: [
      {
        heading: "지원 후에는 어떻게 되나요?",
        body: "모집자가 지원 요청을 승인하면 채팅방이 열리고, 채팅에서 일정과 장소를 조율할 수 있어요.",
      },
      {
        heading: "운전자 인증은 왜 필요한가요?",
        body: "운전자 역할로 활동하려면 차량 정보와 인증 상태가 필요해요. 인증 상태는 프로필과 채팅에서 확인할 수 있어요.",
      },
    ],
  },
  appInfo: {
    title: "어플 정보",
    intro: "다로링크 앱의 현재 정보를 확인하세요.",
    sections: [
      {
        heading: "앱 이름",
        body: "다로링크",
      },
      {
        heading: "버전",
        body: "1.0.0",
      },
      {
        heading: "운영 원칙",
        body: "지역 주민이 신뢰할 수 있는 이동, 채팅, 일손 연결 경험을 만드는 것을 목표로 합니다.",
      },
    ],
  },
  terms: {
    title: "약관 및 정책",
    intro: "서비스 이용에 필요한 주요 동의 항목입니다.",
    sections: [
      {
        heading: "서비스 이용약관",
        body: "사용자는 모집글, 채팅, 지원 기능을 안전하고 정확한 정보로 이용해야 하며 허위 정보 등록은 제한될 수 있어요.",
      },
      {
        heading: "개인정보 처리방침",
        body: "전화번호, 프로필, 차량 정보는 인증과 매칭 기능 제공을 위해 사용되며 앱 기능 범위를 넘어 공개하지 않아요.",
      },
      {
        heading: "위치 정보",
        body: "위치 정보는 지도 이동과 버스/장소 기능을 위해 사용되며 사용자의 권한 허용 상태에 따라 동작합니다.",
      },
    ],
  },
};

export function ProfileInfoScreen({ kind, onBack }: ProfileInfoScreenProps) {
  const content = infoContent[kind];

  return (
    <View style={styles.safeArea}>
      <Header
        title={content.title}
        showBack
        onBack={onBack}
        testID={`profile-info-${kind}-header`}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        testID={`profile-info-${kind}`}
      >
        <Text style={styles.intro}>{content.intro}</Text>
        <View style={styles.sectionList}>
          {content.sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.heading}>{section.heading}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: profileLayout.infoTopPadding,
    paddingBottom: 40,
    gap: profileLayout.infoContentGap,
  },
  intro: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  sectionList: {
    gap: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    gap: 8,
  },
  heading: {
    color: colors.black,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  body: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.base,
  },
});
