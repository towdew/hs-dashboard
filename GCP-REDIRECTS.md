# GCP 연결 페이지 운영 안내

2026-10-26 사용자 최종 지시: 기존 파일은 삭제하지 않고 연결 HTML 교체·추가만 적용했다.

- 기존 도메인 www.content-dashboard-lg.com, Pages main /(root), DNS와 공개 설정은 유지한다. 루트 CNAME은 변경하지 않는다.
- 기존 HTML26개를 연결/안내 HTML로 교체하고 root index, BU index, 404와 .nojekyll을 추가한다.
- 기존 Excel·JSON·JS·문서·워크플로와 기타 파일은 그대로 남아 있다. 기존 README도 교체하지 않는다. 이 작업은 원본이나 과거 Git 이력의 삭제 작업이 아니다.
- 일반 Viewer 대시보드·신호등·도구는 GCP에서 암호 없이 조회한다. 통합홈, MS Phase2/Live, HS 업무리뷰/Legal Issue와 관리자 기능은 로그인 유지한다.
- 기존 응답 링크 2개는 새 발송 토큰과 호환되지 않아 안내만 제공한다. VMS DesignSystem은 GCP 미이관 안내를 제공한다.
- 접속 시 주소창은 GCP의 run.app 주소로 바뀐다. query/hash를 보존하며 JavaScript 미사용 시 고정 링크로 수동 이동한다. raw 파일/API/POST를 전달하는 프록시가 아니다.
- 앞으로 실제 대시보드 코드/데이터는 비공개 aiwesley1971/bu-dashboard에서 수정한다. 이 저장소에 남긴 옛 업무 파일은 현재 GCP의 운영 원본이 아니다.
- 연결 HTML을 원래 대시보드 코드로 덮어쓰지 않는다. 복구가 필요하면 이번 연결 적용 커밋의 parent와 diff를 검토한다. 파일 일괄 삭제나 force push는 하지 않는다.
