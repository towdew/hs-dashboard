# IT 대시보드 엑셀 업데이트 방법

GitHub 웹에서 엑셀만 올리면 몇 분 안에 https://www.content-dashboard-lg.com/it/ 에 반영됩니다.
올린 파일은 자동으로 검사하고, 문제가 있으면 **반영하지 않고 이전 상태로 되돌린 뒤** 메일로 알려 줍니다.

> ⚠️ 이 저장소는 **공개**입니다. PTT Raw·CMS·Readiness 같은 원본 파일은 절대 올리지 마세요. 아래 두 파일만 올립니다.

---

## 1. IT 제품 현황

1. 이 폴더의 **[IT_product_status.xlsx](IT_product_status.xlsx)** 를 열고 오른쪽 위 **다운로드(↓)** 를 누릅니다. 항상 지금 화면과 같은 최신본입니다.
2. 엑셀에서 고칩니다.
   - 한 줄 = 모델 × 국가 하나. 행을 추가·삭제·수정할 수 있습니다.
   - **1행(머리글)은 바꿔도 되지만 2행(회색 키)은 지우거나 고치지 마세요.**
   - 시트 이름 `IT 제품 현황` 을 바꾸지 마세요.
   - 필수: **그룹**, **Locale**, **모델**
   - **단계**: `Live` / `In Progress` / `Client Review` / `Clarify` / `Precheck` / `Cancelled` / `기타`
   - **그룹 색상**: `green` / `orange` / `red` / `blue` / `gray`
   - **라이브 URL**·**STG URL**: `https://` 로 시작
   - **STG 있음**·**PIM 확인**: `Y` / `N`
   - 각 열 설명은 `정보` 시트에 있습니다. `정보` 시트의 파일명(PTT Raw 파일 등)은 화면의 '기준' 표시에 쓰입니다.
3. 파일 이름을 **`IT_product_status.xlsx` 그대로** 두고 이 폴더(`it/_upload`)에서 **Add file → Upload files** 로 올린 뒤 **Commit changes** 를 누릅니다.

## 2. Global Request (GR 시트)

1. 상위 폴더 `it/` 의 **[Global Request.xlsx](../Global%20Request.xlsx)** 를 다운로드해 고칩니다.
   - 시트당 GR 태스크 1개, `Head` 로 시작하는 머리글 행 아래가 국가 행입니다. 기존 구조를 유지해 주세요.
2. 파일 이름을 **`Global Request.xlsx` 그대로** 두고 **`it/` 폴더**에서 **Add file → Upload files** 로 올립니다.
3. 사이드바의 **금주 변경(N) 배지**는 자동으로 다시 계산됩니다. 기준은 이번 주 월요일 직전의 GR 파일입니다.

---

## 반영 확인

- 올린 뒤 저장소 상단 **Actions** 탭에서 `IT 엑셀 업로드 반영` 실행을 누르면 결과 요약(반영 건수·오류 사유)이 보입니다.
  - ✅ 초록색: 반영 완료. 1~3분 뒤 사이트에서 새로고침(Ctrl+F5)
  - ❌ 빨간색: 반영 안 됨. 요약에 적힌 행 번호·사유를 고쳐 다시 올리세요. 올린 파일은 이전 버전으로 자동 복구됩니다.
- 문의: parkjs1362
