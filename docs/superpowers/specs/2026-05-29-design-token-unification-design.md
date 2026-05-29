# 디자인 토큰 통일 정비

작성일: 2026-05-29

## 배경 / 문제

화면마다 폰트 굵기·크기 지정 방식이 제각각이라 디자인 컴포넌트들이 통일돼 보이지 않는다. 정량 진단 결과(`screens/` + `components/`, 38개 tsx 중 29개가 typography 사용):

- **굵기 이중 지정 (핵심 원인)**: `fontFamily: typography.family.body`(= `NotoSans_400Regular`, 183건)에 `fontWeight: bold/medium`(254건)을 동시에 얹는 패턴이 만연. RN에서 NotoSans 같은 named 폰트는 **fontFamily가 굵기를 결정**하고 `fontWeight`는 iOS에서 synthetic bold, Android에서는 무시된다. 같은 "bold" 의도가 코드·플랫폼마다 다르게 렌더링됨.
- **굵기 표현 혼재**: `typography.weight.*`(151건)와 문자열 리터럴 `"500"`(15건)·`"600"`(7건)이 섞여 있음.
- **fontSize 스케일 이탈**: 토큰은 xs/sm/base/lg(12/14/16/18)뿐인데 실제로는 10·11·20·24·28·30·48·56이 화면에 직접 박힘.
- **색상 하드코딩**: BottomNav, CurrentLocationIcon, ChatScreen, MapScreen 4개 파일에 토큰 밖 hex/rgba 26건.

폰트 4종(`NotoSans_400Regular`/`500Medium`/`600SemiBold`/`700Bold`)은 `App.tsx`에서 `useFonts`로 모두 로드돼 있어 fontFamily 기반 통일이 안전하다.

## 목표

화면별로 제각각인 폰트 굵기·크기·색상 지정을 토큰 기반 단일 규칙으로 수렴시킨다. **시각적 결과(굵기·크기·색)는 의도대로 보존**하고 표현 방식만 통일한다.

비목표: 레이아웃 변경, 컴포넌트 신규 추가(AppText 등), 디자인 자체의 재설계. 표현 방식 통일에만 집중한다.

## 설계 결정 (확정)

- **굵기**: `fontFamily`(NotoSans named)로만 통일하고 `fontWeight`는 전부 제거한다.
- **사이즈**: 실사용값 기반으로 스케일을 확장한다(신규 타이포 스케일을 발명하지 않음).
- **28pt → 24pt(xxl)로 흡수**: 1건뿐이고 24가 이미 6건으로 정착된 값이라 가장 가까운 정착값으로 정규화.
- **family 별칭 정리**: `body`/`regular`/`nav`가 전부 `NotoSans_400Regular`로 동일. `regular`를 정본으로 삼고 `body`/`nav`는 deprecated 별칭으로 유지하되, 이번 작업에서 전부 `regular`로 치환한다.

## 변경 사항

### 1. `constants/typography.ts` 재정의

`size`/`lineHeight`를 실사용값 기반으로 확장:

```
size:        xs:12  sm:14  base:16  lg:18  xl:20  xxl:24  display:30  hero:48  giant:56
lineHeight:  xs:16  sm:20  base:22  lg:26  xl:28  xxl:32  display:38  hero:56  giant:64
```

- 일회성 10/11 → `xs`(12)로 흡수.
- 28 → `xxl`(24)로 흡수.
- `weight` 객체는 제거(코드에서 더 이상 참조하지 않음).
- `family`에서 `body`/`nav` 별칭은 제거하고 `regular`/`medium`/`semibold`/`bold` 4종만 남긴다.

### 2. fontWeight → fontFamily 변환 (전 화면, 약 28개 파일)

각 텍스트 스타일 블록에서 결정적 규칙 적용:

| 기존 fontWeight | 변환 후 fontFamily |
|---|---|
| `weight.regular` / `"400"` | `family.regular` |
| `weight.medium` / `"500"` | `family.medium` |
| `weight.semibold` / `"600"` | `family.semibold` |
| `weight.bold` / `"700"` | `family.bold` |

**핵심 주의**: 대부분 `family.body`(=regular) + `fontWeight: bold` 조합이므로, fontWeight만 지우면 굵게가 사라진다. 반드시 **fontWeight 값에 맞춰 fontFamily를 승격시키고 fontWeight 줄을 제거**한다. 같은 스타일에 이미 fontFamily가 있으면 더 굵은 쪽(=fontWeight가 지정한 굵기)을 정답으로 채택한다.

`family.body`/`family.nav` 참조는 전부 `family.regular`로 치환.

### 3. 하드코딩 색상 토큰화 (4개 파일)

BottomNav, CurrentLocationIcon, ChatScreen, MapScreen의 hex/rgba 26건을 `colors.*`로 치환. 토큰에 없는 색은 의미 있는 이름으로 `constants/colors.ts`에 신규 추가.

### 4. off-scale fontSize 정규화

일회성 리터럴 fontSize(10/11/20/28 등)를 새 size 토큰 참조로 치환.

## 검증

- `npm run typecheck` 통과 (weight 토큰 제거·family 별칭 제거로 인한 참조 누락이 여기서 전부 잡힘).
- 기존 `__tests__` 전체 통과.
- 변환 전후 굵기 매핑을 표로 회귀 점검 — 특히 `family.body` + `fontWeight: bold` 조합이 `family.bold`로 올바르게 승격됐는지 확인.
