# 🐍 PyQuiz — Python 면접 대비 AI 퀴즈 플랫폼

> Gemini AI가 실시간으로 Python 면접 문제를 생성하고, 작성한 답변을 즉시 평가해주는 학습 플랫폼

![CI](https://github.com/YOUR_USERNAME/pyquiz/actions/workflows/ci.yml/badge.svg)

## 📸 주요 기능

- **AI 문제 생성** — Google Gemini가 카테고리/난이도에 맞는 실제 면접 문제를 생성
- **AI 답변 평가** — 서술형 답변을 AI가 채점 기준에 따라 정답/부분정답/오답으로 평가 + 피드백
- **6개 카테고리** — Python 기초 / OOP / 자료구조 / 고급 Python / 실무 면접 / 랜덤 믹스
- **3단계 난이도** — 입문(10점) / 중급(20점) / 고급(30점)
- **리더보드** — 닉네임 등록 후 점수 비교

## 🛠 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, Framer Motion |
| Backend | Django 5, Django REST Framework |
| AI | Google Gemini 1.5 Flash |
| DB | SQLite (개발) / PostgreSQL (배포) |
| 패키지 관리 | uv (Python), npm (Node) |
| 배포 | Vercel (프론트) + Railway (백엔드) |
| CI/CD | GitHub Actions |

## 🚀 로컬 실행

### 사전 준비

- Python 3.12+
- Node.js 20+
- [uv](https://docs.astral.sh/uv/) 설치: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- [Google AI Studio](https://aistudio.google.com/)에서 Gemini API 키 발급

### 백엔드 실행

```bash
cd backend

# 의존성 설치
uv sync

# 환경변수 설정
cp .env.example .env
# .env 파일에서 GEMINI_API_KEY, DJANGO_SECRET_KEY 수정

# DB 마이그레이션
uv run python manage.py migrate

# 서버 실행
uv run python manage.py runserver
# → http://localhost:8000
```

### 프론트엔드 실행

```bash
cd frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

# 개발 서버 실행
npm run dev
# → http://localhost:3000
```

## 🌐 배포 방법

### 1. 백엔드 → Railway

1. [Railway](https://railway.app)에서 New Project → Deploy from GitHub
2. `backend/` 디렉토리를 루트로 설정 (Root Directory: `backend`)
3. 환경변수 추가:
   ```
   DJANGO_SECRET_KEY=생성한_시크릿_키
   GEMINI_API_KEY=발급받은_키
   DEBUG=False
   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
   DATABASE_URL=자동으로_제공됨
   ```
4. PostgreSQL 플러그인 추가 → `DATABASE_URL` 자동 설정

### 2. 프론트엔드 → Vercel

1. [Vercel](https://vercel.com)에서 New Project → Import GitHub repo
2. Root Directory: `frontend`
3. 환경변수 추가:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```
4. Deploy → 완료 시 GitHub push마다 자동 배포

### 3. vercel.json의 백엔드 URL 수정

```json
// frontend/vercel.json
"destination": "https://your-actual-backend.railway.app/api/:path*"
```

## 📁 프로젝트 구조

```
pyquiz/
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI
├── backend/
│   ├── config/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── quiz/
│   │   ├── models.py       # DB 모델
│   │   ├── views.py        # API 뷰
│   │   ├── serializers.py  # DRF 직렬화
│   │   ├── urls.py
│   │   └── ai_service.py   # Gemini 연동
│   ├── pyproject.toml      # uv 패키지 관리
│   └── Procfile            # Railway 배포
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx          # 홈 (카테고리/난이도 선택)
    │   │   ├── quiz/page.tsx     # 퀴즈 진행
    │   │   ├── quiz/result/page.tsx  # 결과
    │   │   └── leaderboard/page.tsx  # 리더보드
    │   ├── lib/
    │   │   ├── api.ts        # API 호출
    │   │   └── store.ts      # Zustand 상태관리
    │   └── types/index.ts    # TypeScript 타입
    ├── vercel.json
    └── package.json
```

## 🔑 API 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/health/` | 서버 상태 확인 |
| POST | `/api/quiz/generate/` | AI 문제 생성 |
| POST | `/api/quiz/answer/` | 답변 제출 및 AI 평가 |
| POST | `/api/quiz/complete/` | 퀴즈 완료 및 리더보드 등록 |
| GET | `/api/leaderboard/` | 리더보드 조회 |

## 📝 환경변수 목록

### Backend (.env)
| 변수 | 설명 |
|------|------|
| `DJANGO_SECRET_KEY` | Django 시크릿 키 |
| `GEMINI_API_KEY` | Google Gemini API 키 |
| `DEBUG` | True/False |
| `CORS_ALLOWED_ORIGINS` | 허용할 프론트 URL (콤마 구분) |
| `DATABASE_URL` | PostgreSQL URL (배포 시) |

### Frontend (.env.local)
| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_API_URL` | Django 백엔드 URL |
