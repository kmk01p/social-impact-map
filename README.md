# 🌍 소셜 임팩트 맵 (Social Impact Map)

<div align="center">

![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![D1 Database](https://img.shields.io/badge/D1-Database-F38020?logo=cloudflare&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

**봉사활동을 지도에 기록하고 뱃지 시스템으로 참여를 독려하는 커뮤니티 중심 플랫폼**

[🚀 라이브 데모](https://3000-i1u13zbsnhi7dkkqi0lr7.e2b.dev) | [📖 문서](#사용자-가이드) | [🛠️ 개발 가이드](#개발자-가이드)

</div>

---

## 📸 스크린샷

### 📊 메인 대시보드
전체 참가자, 활동 수, 봉사시간, 뱃지 수를 한눈에 확인하고 뱃지 컬렉션을 관리할 수 있습니다.

![메인 대시보드](https://page.gensparksite.com/v1/base64_upload/38d4e04e008077292b7b16cac72a6fa0)

### 🗺️ 봉사활동 지도
서울 지역의 봉사활동 위치를 인터랙티브 지도에서 확인하고, 카테고리별 필터링이 가능합니다.

![봉사활동 지도](https://page.gensparksite.com/v1/base64_upload/c2d33ef47897f2541f20544fc79581cf)

---

## 🎯 프로젝트 개요

**소셜 임팩트 맵**은 봉사활동을 체계적으로 기록하고 커뮤니티와 함께 공유하는 웹 플랫폼입니다. 지도 기반의 직관적인 인터페이스와 뱃지 시스템을 통해 봉사활동 참여를 독려합니다.

### 🎨 디자인 철학
- **커뮤니티 중심**: 모든 참가자의 활동을 통합하여 커뮤니티 임팩트 시각화
- **접근성**: 로그인 없이 누구나 쉽게 사용할 수 있는 공개형 플랫폼
- **직관적 UX**: 차분하고 전문적인 디자인으로 사용자 친화적 경험 제공

---

## ⭐ 주요 특징

### 📊 **커뮤니티 통계 대시보드**
- **총 참가자**: 전체 활동 참여자 수 표시
- **총 활동**: 등록된 모든 봉사활동 수
- **총 시간**: 커뮤니티 전체 봉사 시간 누적
- **뱃지 수**: 전체 획득된 뱃지 개수

### 🗺️ **인터랙티브 지도**
- **Leaflet.js** 기반 고성능 지도
- **봉사활동 마커**: 각 활동의 정확한 위치 표시
- **카테고리 필터**: 환경보호, 교육, 복지, 문화예술별 필터링
- **팝업 정보**: 마커 클릭으로 활동 상세 정보 확인

### 🏆 **뱃지 시스템**
- **6가지 뱃지**: 첫 걸음, 열정가, 헌신자, 환경지킴이, 교육봉사자, 지역사랑
- **자동 획득**: 조건 달성 시 자동으로 뱃지 부여
- **진행률 표시**: 각 뱃지별 현재 진행률 시각화

### 📜 **PDF 인증서**
- **jsPDF** 기반 클라이언트 사이드 생성
- **개인별 통계**: 사용자별 봉사 시간, 활동 수, 뱃지 정보
- **공식 인증서**: 다운로드 가능한 봉사활동 증명서

---

## 🛠️ 기술 스택

### **Backend**
- **[Hono Framework](https://hono.dev/)** `v4.0+` - 초고속 엣지 웹 프레임워크
- **TypeScript** `v5.0+` - 타입 안전성과 개발자 경험
- **Cloudflare Workers** - 전 세계 엣지에서 실행되는 서버리스 런타임

### **Database & Storage**
- **[Cloudflare D1](https://developers.cloudflare.com/d1/)** - 글로벌 분산 SQLite 데이터베이스
- **Database Migrations** - 버전 관리되는 스키마 변경
- **Local Development** - `--local` 플래그로 로컬 SQLite 개발 환경

### **Frontend**
- **Vanilla JavaScript** - 프레임워크 없는 순수한 성능
- **[TailwindCSS](https://tailwindcss.com/)** - 유틸리티 우선 CSS 프레임워크
- **[Leaflet.js](https://leafletjs.com/)** - 오픈 소스 인터랙티브 지도 라이브러리
- **[jsPDF](https://github.com/parallax/jsPDF)** - 클라이언트 사이드 PDF 생성

---

## 🚀 현재 구현 기능

### ✅ **핵심 기능**

#### 1. 소셜 임팩트 지도
- 📍 **위치 마커**: 모든 봉사활동의 정확한 GPS 위치 표시
- 🎯 **카테고리 필터**: 6가지 봉사 분야별 필터링
- 🏢 **기관 정보**: 봉사 기관 위치 및 연락처 표시
- 💬 **상세 팝업**: 활동 제목, 날짜, 시간, 참여자 정보

#### 2. 봉사활동 관리
- ➕ **활동 등록**: 제목, 카테고리, 날짜, 시간, 위치 정보 입력
- 📝 **상세 기록**: 활동 설명, 참여 인원, 봉사 시간 기록
- 📋 **목록 관리**: 등록된 모든 활동의 체계적 관리
- ✅ **인증 시스템**: 활동 검토 및 승인 프로세스

#### 3. 뱃지/레벨 시스템
```
🌱 첫 걸음: 첫 번째 봉사활동 완료
🔥 열정가: 10시간 이상 봉사 (현재 미획득)
💎 헌신자: 50시간 이상 봉사 (현재 미획득)
🌍 환경지킴이: 환경보호 활동 5회 이상 (현재 미획득)  
📚 교육봉사자: 교육 활동 3회 이상 (현재 미획득)
❤️ 지역사랑: 3곳 이상 다른 지역에서 활동 (현재 미획득)
```

#### 4. 통계 및 분석
- **커뮤니티 통계**: 총 참가자 3명, 총 활동 5회, 총 시간 20시간
- **카테고리별 분석**: 환경보호 (3회, 11.5시간), 교육 (2회, 8.5시간)
- **실시간 업데이트**: 새 활동 등록 시 통계 자동 갱신

---

## 📡 API 문서

### 🌐 **Public API Endpoints** (인증 불필요)

#### 전체 통계 조회
```http
GET /api/stats
```
**응답 예시:**
```json
{
  "stats": {
    "totalUsers": 3,
    "totalActivities": 5, 
    "totalHours": 20,
    "categoryStats": [
      {
        "category": "환경보호",
        "count": 3,
        "hours": 11.5
      },
      {
        "category": "교육", 
        "count": 2,
        "hours": 8.5
      }
    ]
  }
}
```

#### 봉사활동 목록
```http
GET /api/activities
```

#### 지도 데이터
```http
GET /api/map-data
```

#### 뱃지 목록
```http
GET /api/badges
```

#### 새 활동 등록
```http
POST /api/activities
Content-Type: application/json

{
  "title": "해변 정화 활동",
  "description": "플라스틱 쓰레기 수거 및 분류",
  "category": "환경보호",
  "activity_date": "2025-08-29",
  "start_time": "09:00",
  "end_time": "12:00", 
  "hours": 3,
  "location_name": "해운대 해변",
  "latitude": 35.1588,
  "longitude": 129.1603
}
```

---

## 📖 사용자 가이드

### 🏠 **메인 대시보드 사용법**

1. **통계 카드 확인**
   - 📊 총 참가자: 현재 플랫폼 사용자 수
   - 📈 총 활동: 등록된 모든 봉사활동 수
   - ⏰ 총 시간: 커뮤니티 전체 봉사 시간
   - 🏆 뱃지 수: 획득된 모든 뱃지 개수

2. **뱃지 컬렉션**
   - 🌱 **획득 뱃지**: 노란색 배경으로 표시
   - 🔒 **미획득 뱃지**: 회색 배경, 획득 조건 표시
   - 📊 **진행률**: 각 뱃지별 달성 정도 확인

### 🗺️ **봉사활동 지도 활용**

1. **지도 탐색**
   - 🔍 **확대/축소**: 마우스 휠 또는 +/- 버튼
   - 🖱️ **이동**: 드래그로 지도 이동
   - 📍 **마커 클릭**: 봉사활동 상세 정보 팝업

2. **카테고리 필터링**
   - 🔵 **전체**: 모든 활동 표시
   - 🟢 **환경보호**: 환경 관련 활동만 표시
   - 🟡 **교육**: 교육 봉사만 표시
   - 🟣 **복지**: 복지 관련 활동만 표시
   - 🟠 **문화예술**: 문화예술 활동만 표시

### ➕ **새 봉사활동 등록**

1. **기본 정보 입력**
   ```
   제목: 활동명을 간단명료하게 작성
   카테고리: 6개 분야 중 해당 분야 선택
   날짜: 활동 실시 날짜
   시작/종료시간: 정확한 봉사 시간 입력
   ```

2. **위치 정보 설정**
   ```
   장소명: 봉사 장소의 정확한 이름
   주소: 상세 주소 (선택사항)
   지도 클릭: 정확한 GPS 좌표 설정
   ```

3. **활동 상세 정보**
   ```
   설명: 활동 내용 상세 기술
   참여자: 함께 참여한 인원 수
   메모: 특이사항이나 느낀점
   ```

### 📜 **인증서 발급**

1. **프로필 탭 접속**
   - 우측 상단 "프로필" 버튼 클릭

2. **인증서 생성**
   - "봉사활동 인증서 발급" 버튼 클릭
   - 개인별 통계가 반영된 PDF 자동 생성
   - 브라우저 다운로드 폴더에 저장

---

## 👨‍💻 개발자 가이드

### 🏗️ **로컬 개발 환경 설정**

#### 필요 조건
```bash
Node.js >= 18.0.0
npm >= 9.0.0  
Git >= 2.30.0
```

#### 설치 및 실행
```bash
# 1. 저장소 클론
git clone https://github.com/kmk01p/social-impact-map.git
cd social-impact-map

# 2. 의존성 설치
npm install

# 3. 데이터베이스 설정
npm run db:migrate:local
npm run db:seed

# 4. 개발 서버 시작
npm run build
npm run dev:sandbox
```

### 🔧 **개발 스크립트**
```json
{
  "scripts": {
    "dev": "vite",
    "dev:sandbox": "wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000",
    "build": "vite build",
    "preview": "wrangler pages dev dist",
    "db:migrate:local": "wrangler d1 migrations apply webapp-production --local",
    "db:seed": "wrangler d1 execute webapp-production --local --file=./seed.sql",
    "db:reset": "rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local && npm run db:seed"
  }
}
```

### 🗄️ **데이터베이스 스키마**
```sql
-- 사용자 테이블
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 봉사활동 테이블  
CREATE TABLE volunteer_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  activity_date DATE NOT NULL,
  hours REAL NOT NULL,
  location_name TEXT,
  latitude REAL,
  longitude REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 뱃지 테이블
CREATE TABLE badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  condition_type TEXT,
  condition_value INTEGER
);
```

---

## 🌐 URLs

- **🚀 라이브 데모**: https://3000-i1u13zbsnhi7dkkqi0lr7.e2b.dev
- **📁 GitHub**: https://github.com/kmk01p/social-impact-map
- **💡 이슈 추적**: https://github.com/kmk01p/social-impact-map/issues

---

## 🚀 배포 상태

- **플랫폼**: Cloudflare Pages (샌드박스)
- **상태**: ✅ 로컬 개발 완료, 데모 서비스 운영 중
- **기술 스택**: Hono + D1 Database + Leaflet.js + TailwindCSS  
- **마지막 업데이트**: 2025-08-29
- **현재 버전**: 커뮤니티 중심 공개형 플랫폼

---

## 🔄 향후 개선 계획

### 🎯 **단기 목표**
- [ ] 🔐 **사용자 인증 시스템** - 개인별 데이터 분리
- [ ] 🌍 **국제화 지원** - 다국가 봉사활동 기록
- [ ] 📱 **모바일 최적화** - 반응형 디자인 개선
- [ ] ⚡ **성능 최적화** - 로딩 속도 및 캐싱

### 🚀 **중기 목표**  
- [ ] 🤝 **소셜 기능** - 활동 공유 및 팀 봉사
- [ ] 🔔 **알림 시스템** - 뱃지 획득 및 활동 알림
- [ ] 📊 **고급 분석** - 트렌드 분석 및 인사이트
- [ ] 🏢 **기관 관리** - 봉사 기관 등록 및 관리

### 🌟 **장기 목표**
- [ ] 🤖 **AI 추천** - 개인 맞춤 봉사활동 추천
- [ ] 🎮 **게임화** - 레벨업 시스템 및 리더보드
- [ ] 🌐 **다국어 지원** - 글로벌 사용자 대응
- [ ] 📈 **통계 대시보드** - 관리자용 분석 도구

---

## 🤝 기여 방법

### 📋 **기여 가이드**
1. 저장소 포크 및 클론
2. 새 브랜치 생성 (`git checkout -b feature/새기능`)
3. 변경사항 커밋 (`git commit -m 'feat: 새 기능 추가'`)
4. 브랜치 푸시 (`git push origin feature/새기능`)
5. Pull Request 생성

### 🐛 **버그 리포트**
- [GitHub Issues](https://github.com/kmk01p/social-impact-map/issues)에 버그 신고
- 재현 단계 및 환경 정보 포함

### 💡 **기능 제안**
- [GitHub Issues](https://github.com/kmk01p/social-impact-map/issues)에 새 기능 제안
- 사용 사례 및 기대 효과 설명

---

## 📜 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

```
MIT License

Copyright (c) 2025 Social Impact Map Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">

**🌟 함께 만드는 더 나은 세상 🌟**

[⭐ Star this repo](https://github.com/kmk01p/social-impact-map) | [🐛 Report Bug](https://github.com/kmk01p/social-impact-map/issues) | [💡 Request Feature](https://github.com/kmk01p/social-impact-map/issues)

Made with ❤️ by Social Impact Map Contributors

</div>