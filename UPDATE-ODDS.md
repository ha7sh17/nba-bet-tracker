# 🎰 배당률 데이터 업데이트 가이드

이 문서는 oddschecker에서 NBA 우승 배당률을 가져와 `odds.json`을 업데이트하는 방법을 설명합니다.

## 왜 수동 업데이트가 필요한가?

oddschecker는 Cloudflare 보호 + 클라이언트 사이드 렌더링을 사용해서 단순 fetch로는 데이터를 가져올 수 없음. 브라우저로 직접 접속해서 파싱해야 함.

## 업데이트 방법

### 1단계: 브라우저로 oddschecker 열기

```
clawd 프로필 브라우저로 열어줘:
https://www.oddschecker.com/basketball/nba/nba-championship/winner
```

또는 Clawdbot 브라우저 도구 사용:
```javascript
browser action=open profile=clawd targetUrl="https://www.oddschecker.com/basketball/nba/nba-championship/winner"
```

### 2단계: 데이터 파싱

페이지가 로드되면 아래 JavaScript를 실행해서 배당률 추출:

```javascript
// browser act로 evaluate 실행
() => {
  const rows = document.querySelectorAll('tr');
  const data = [];
  rows.forEach(row => {
    const nameCell = row.querySelector('td a[href*="bet-history"]');
    const oddsCell = row.querySelector('td:nth-child(2) p');
    if (nameCell && oddsCell) {
      data.push({
        team: nameCell.textContent.trim(),
        odds: oddsCell.textContent.trim()
      });
    }
  });
  return JSON.stringify(data);
}
```

### 3단계: odds.json 업데이트

파싱한 데이터에서 참가자 팀만 추출해서 `odds.json` 업데이트:

**참가자 팀 매핑:**
| 참가자 | 팀 | teamId |
|--------|-----|--------|
| 한신 | Denver Nuggets | DEN |
| 동수 | Cleveland Cavaliers | CLE |
| 승우 | Los Angeles Lakers | LAL |
| 한근 | New York Knicks | NY |
| 에스겔 | Houston Rockets | HOU |
| 지혁 | San Antonio Spurs | SA |
| 성욱 | Oklahoma City Thunder | OKC |

**odds.json 형식:**
```json
{
  "lastUpdated": "2025-02-12T14:30:00+09:00",
  "source": "oddschecker.com",
  "odds": {
    "OKC": "6/5",
    "DEN": "11/2",
    "NY": "12",
    "CLE": "12",
    "SA": "15",
    "HOU": "20",
    "LAL": "40"
  },
  "allTeams": [...]
}
```

## 한 줄 요약 (Clawdbot용)

신이 "배당률 업데이트해줘"라고 하면:

1. `browser action=start profile=clawd`
2. `browser action=open profile=clawd targetUrl="https://www.oddschecker.com/basketball/nba/nba-championship/winner"`
3. 페이지 로드 후 `browser action=act` 로 위 JS 실행
4. 결과에서 DEN, CLE, LAL, NY, HOU, SA, OKC 팀 배당률 추출
5. `~/Programming/nba-bet-tracker/odds.json` 파일 업데이트
6. `lastUpdated`를 현재 시간으로 갱신

## 배당률 해석

- 분수 형식: `6/5` = 5 걸면 6 이익 (낮을수록 우승 확률 높음)
- 숫자가 작을수록 유리: `6/5` > `11/2` > `12` > `40`
- 정렬: `fractionalToDecimal()` 함수로 소수 변환 후 오름차순

## 파일 위치

- 프로젝트: `~/Programming/nba-bet-tracker/`
- 배당률 데이터: `odds.json`
- 메인 페이지: `index.html`
