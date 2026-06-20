# 다로링크 1.0.0 릴리즈 노트

릴리즈일: 2026-06-20
상태: 최종 제출 및 운영 인수용 릴리즈

## 개요

다로링크 1.0.0은 작은 지역의 이동, 일손, 버스 정보를 지도 중심으로 연결하는 Expo React Native 앱의 첫 정식 릴리즈입니다. Android APK와 웹 브라우저 환경을 함께 지원하며, 프로덕션에서는 Darori API 서버와 실제 지도/인증/데이터 연동을 기준으로 동작합니다.

## 사용자 기능

- 지도 홈에서 주변 이동 모집글, 인적 자원 글, 버스 정보를 카테고리별로 탐색합니다.
- 이동 모집글 작성, 지원, 승인/거절, 승인 후 채팅방 생성 흐름을 제공합니다.
- 인적 자원 등록과 상세 글 탐색으로 지역의 작은 일자리와 일손을 연결합니다.
- 전화번호 인증, 프로필 관리, 내가 쓴 글, 찜한 글, 설정 화면을 제공합니다.
- 채팅 목록, 채팅방, 사진 메시지, 신고 플로우를 지원합니다.
- 버스 목격 기록, 최근 목격 내역, 청도 행복버스 3번 노선 정보와 시간표를 제공합니다.
- 개인정보 처리방침 페이지를 포함합니다.

## 기술 및 운영 범위

- Expo React Native, React Native Web, TypeScript 기반입니다.
- Naver Maps native SDK와 Web Dynamic Map을 사용합니다.
- Node.js/TypeScript API 서버, PostgreSQL, Redis 연동을 지원합니다.
- Vercel 웹 배포와 API Function 라우팅을 지원합니다.
- 로컬 및 운영 환경변수 목록은 `readme.md`와 `docs/development-and-operations.md`를 기준으로 관리합니다.

## 배포 전 확인 항목

- `npm run typecheck`
- `npm test`
- Vercel 환경변수에 `EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID`가 설정되어 있는지 확인합니다.
- 운영 API base URL이 `EXPO_PUBLIC_DARORI_API_BASE_URL`에 설정되어 있는지 확인합니다.
- 서버 전용 비밀값이 모바일 앱 번들에 포함되지 않도록 `.env.example` 기준으로 분리합니다.
- Android/iOS 지도 키와 Naver Cloud Platform 서비스 URL 등록 상태를 확인합니다.

## 참고 문서

- 개발과 운영 가이드: `docs/development-and-operations.md`
- 현재 아키텍처 노트: `docs/current-architecture.md`
- 백엔드/API 레퍼런스: `docs/backend-api-reference.md`
- AWS EC2 배포 가이드: `docs/aws-ec2-deployment.md`
