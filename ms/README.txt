LG.com MS Request Dashboard

Data file:
- ms-global-request.xlsx

Single-sheet data format:
- Region
- Project Name
- Task Status in PTT
- Model Name
- Pg#
- Live URL

Dashboard behavior:
- The UI is unchanged from the existing dashboard.
- Each unique Model Name is treated as one virtual sheet/title.
- #sheetNavList is generated from Model Name values in first-appearance order.
- Selecting a sidebar item shows only rows belonging to that Model Name.

MS model type tabs:
- Model Name starting with W##-Audio- is grouped under Audio.
- Model Name starting with W##-TV- is grouped under TV.
- The tab count is the number of unique Model Name navigation items.
- The status-board button opens ../ms-status-dashboard/.
