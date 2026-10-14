LG.com MS Request Dashboard

Data source:
- ms-global-request.xlsx (single worksheet)
- Model Name values are split into sidebar items.
- Audio / TV controls inside #sheetNavList filter the full Model Name list.

Displayed columns:
- Region: exact value from the Region column
- Country: Project Name
- Status: Task Status in PTT
- Page#: Pg#
- URL: Live URL

Notes:
- Cells without an Excel fill use a subtle light background.
- The corporate content reminder button opens ../ms-status-dashboard/.

UX Enhancement (ux-enhance.js / ux-enhance.css)
- 기존 sheet-loader.js / common.js / style.css는 수정하지 않았습니다.
- index.html 변경점: ux-enhance.css 링크 1줄, ux-enhance.js 로드 + MSDashUX.init() 호출.
- 사이드바
  · Division 탭(Audio / TV / Inbound Mktg) 아래 Request를 그룹으로 묶어 표시
  · 그룹 기준 전환: [유형] NPI·Feature / Microsite·Playbook / GNB·Category / PDP·PLP 업데이트 / FAQ·SEO
                     [월]   요청주차 기준 월별 (최신순)
  · Model Name "GR26-W25-MS-TV-…-0626" → 제목 + W25 칩 + 요청일(06/26)로 분리 표시
  · 검색(단축키 /): Division 구분 없이 전체 검색, Enter = 첫 결과 열기, Esc = 해제
  · 상태 필터: 전체 / 진행중(잔여 페이지 있음) / 완료(잔여 0)
  · 항목별 진행바 + 완료율(%) — 완료율 = 완료 페이지 / 전체 페이지 (기존 배지와 동일 기준)
  · 그룹 접기·펼치기 상태, 그룹 기준, 필터, 마지막으로 본 Request는 브라우저에 저장
  · 사이드바 접힘(햄버거) 시 그룹 아이콘 레일로 표시
- 유형 분류 규칙은 ux-enhance.js 상단 TYPE_GROUPS에서 키워드로 수정 가능합니다.
- 되돌리기: index.html에서 ux-enhance.css / ux-enhance.js 참조만 삭제하면 기존 화면으로 복귀합니다.

