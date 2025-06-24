# Instagram Clone (Vite + React + FastAPI)

인스타그램의 핵심 기능을 클론한 풀스택 프로젝트입니다. 
프론트엔드는 Vite + React + TypeScript, 백엔드는 FastAPI + SQLite/MySQL로 구성되어 있습니다.

## 🛠️ 기술 스택
- **Frontend:** Vite, React, TypeScript, Axios
- **Backend:** FastAPI, SQLAlchemy, SQLite (MySQL 확장 가능), python-jose, bcrypt
- **Infra:** AWS EC2 (Ubuntu 22.04, 프리티어)

## 📦 폴더 구조
```
25_OSS_instagram/
  ├── backend/   # FastAPI 백엔드
  │   ├── main.py
  │   ├── requirements.txt
  │   └── ...
  └── frontend/  # Vite + React 프론트엔드
      ├── src/
      ├── public/
      ├── index.html
      ├── package.json
      └── ...
```

## ✨ 주요 기능
- 회원가입/로그인 (JWT 인증)
- 피드(게시글) CRUD, 이미지 업로드
- 댓글, 좋아요, 팔로우/언팔로우
- 프로필, 팔로워/팔로잉 목록
- 인스타그램과 유사한 UI/UX

## ⚡ 설치 및 실행 방법

### 1. 로컬에서 실행
#### (1) 백엔드
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### (2) 프론트엔드
```bash
cd frontend
npm install
npm run dev -- --host
```

### 2. EC2 서버에서 배포
#### (1) 백엔드
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### (2) 프론트엔드 (정적 빌드)
```bash
cd frontend
npm install
npm run build
sudo npm install -g serve
sudo serve -s dist -l 5173
```
- 브라우저에서 `http://<EC2 퍼블릭 IP>:5173/` 접속

### 3. 환경변수 예시 (프론트엔드)
`frontend/.env` 파일 생성:
```
VITE_API_URL=http://<EC2 퍼블릭 IP>:8000
```

## 📝 배포/운영 팁
- EC2 보안그룹에서 22(SSH), 80, 443, 5173, 8000 포트 오픈
- 프론트엔드 빌드시 반드시 `frontend/index.html` 존재 필요
- 정적 배포는 `serve` 사용, dev 서버는 `--host 0.0.0.0` 옵션 필수
- DB, S3 등 외부 서비스 연동 시 환경변수로 관리 권장

## 🙌 기여 및 문의
- PR/이슈 환영합니다!
- 문의: [프로젝트 오너 GitHub](https://github.com/TaeYunAhn)