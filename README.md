# DWAD - 외주 고객응대 답변 추천 SaaS

스크린샷 한 장으로 실전 답변 3개. 프리랜서·외주 개발자·세일즈맨을 위한 고객응대 답변 추천 MVP.

## 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Auth**: Supabase Auth (Google OAuth)
- **DB**: Supabase (PostgreSQL)
- **OCR**: Google Vision API (또는 호환 API)
- **AI**: OpenAI API (또는 호환 API)

## 실행 가이드

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 `.env.local`로 복사 후 값 입력:

```bash
cp .env.example .env.local
```

필수 환경변수:

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (선택) |
| `AUTH_SECRET` | `openssl rand -base64 32`로 생성 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `OCR_API_URL` | OCR API 엔드포인트 (Google Vision: `https://vision.googleapis.com/v1/images:annotate`) |
| `OCR_API_KEY` | OCR API Key (Google: API Key) |
| `AI_API_URL` | AI API 엔드포인트 (OpenAI: `https://api.openai.com/v1/chat/completions`) |
| `AI_API_KEY` | AI API Key |
| `AI_MODEL_NAME` | 모델명 (예: `gpt-4o-mini`) |
| `NEXT_PUBLIC_APP_URL` | 앱 URL (예: `http://localhost:3000`) |

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. **Authentication > Providers**에서 Google OAuth 활성화
3. **SQL Editor**에서 `supabase/migrations/001_initial_schema.sql` 실행
4. **Settings > API**에서 URL, anon key, service_role key 확인

### 4. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com)에서 OAuth 2.0 클라이언트 ID 생성
2. 승인된 리디렉션 URI에 추가:
   - `https://[PROJECT_REF].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (로컬 개발용)
3. Supabase Dashboard > Authentication > Providers > Google에 Client ID, Secret 입력

### 5. OCR API (Google Vision)

1. Google Cloud Console에서 Vision API 활성화
2. API 키 생성 또는 서비스 계정 키 사용
3. `.env.local`에 `OCR_API_URL`, `OCR_API_KEY` 설정

### 6. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 접속

## 폴더 구조

```
dwad/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ocr/route.ts      # OCR 처리
│   │   │   ├── ai/route.ts       # AI 답변 생성
│   │   │   └── presets/          # 프리셋 CRUD
│   │   ├── auth/                 # 인증 콜백, 로그아웃
│   │   ├── dashboard/            # 대시보드 (업로드, 결과)
│   │   ├── presets/              # 프리셋 관리
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx              # 랜딩
│   ├── components/
│   │   └── Toaster.tsx
│   ├── lib/
│   │   ├── supabase/             # Supabase 클라이언트
│   │   ├── database.types.ts
│   │   └── presets.ts            # 기본 프리셋 데이터
│   └── middleware.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.example
├── package.json
└── README.md
```

## 주요 기능

1. **Google 로그인** - Supabase Auth
2. **스크린샷 업로드** - 붙여넣기(Ctrl+V) / 드래그앤드롭
3. **OCR** - 이미지 텍스트 추출, 정제
4. **AI 답변 3종** - 짧은 / 설명형 / 친절한
5. **프리셋** - 기본(기본/친절/세일즈) + 커스텀, 예시 문장 기반 말투 반영
6. **복사** - 각 답변 카드에서 Copy 버튼

## 데이터 저장 정책

- **이미지**: 영구 저장 안 함 (메모리/임시 처리만)
- **분석/답변 기록**: 저장 안 함
- **프리셋**: DB에 저장 (사용자별)
