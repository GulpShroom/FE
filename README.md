# M·Carry FE

React 19 + Vite 모바일 웹 (375×812). Mock UI.

## 실행

```bash
npm install
npm run dev
```

## 구조

```
src/
  api/           # API 연동 예정
  assets/final/  # 사용 중인 디자인 에셋
  assets/icons/  # 예약
  assets/images/ # 예약
  components/    # AppShell, Modal, ProductSelect
  data/          # mock, figmaMap
  hooks/         # 예약
  pages/         # main | journey | my | register | resell
  styles/        # tokens.css
  utils/         # 예약
```

## 라우트

| 경로 | 화면 |
|------|------|
| `/` | 메인 |
| `/journey` | 패스포트 |
| `/journey/records/:id` | 여정 목록 |
| `/journey/entry/:id` | 여정 상세 |
| `/register` | 등록 플로우 |
| `/resell` | 리셀 |
| `/my` | 마이 |
