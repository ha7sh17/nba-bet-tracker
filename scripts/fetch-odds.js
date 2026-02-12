const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ODDS_URL = 'https://www.oddschecker.com/basketball/nba/nba-championship/winner';

// 참가자 팀 매핑
const TEAM_MAPPING = {
  'Oklahoma City Thunder': 'OKC',
  'Denver Nuggets': 'DEN',
  'Cleveland Cavaliers': 'CLE',
  'New York Knicks': 'NY',
  'Houston Rockets': 'HOU',
  'San Antonio Spurs': 'SA',
  'Los Angeles Lakers': 'LAL'
};

async function fetchOdds() {
  console.log('🚀 Starting odds fetch from oddschecker...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log(`📡 Navigating to ${ODDS_URL}`);
    await page.goto(ODDS_URL, { waitUntil: 'networkidle', timeout: 60000 });
    
    // 테이블 로드 대기
    await page.waitForSelector('tr a[href*="bet-history"]', { timeout: 30000 });
    console.log('✅ Page loaded, extracting data...');

    // 배당률 추출
    const allTeams = await page.evaluate(() => {
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
      return data;
    });

    console.log(`📊 Found ${allTeams.length} teams`);

    // 참가자 팀만 추출
    const participantOdds = {};
    allTeams.forEach(({ team, odds }) => {
      if (TEAM_MAPPING[team]) {
        participantOdds[TEAM_MAPPING[team]] = odds;
        console.log(`  ${TEAM_MAPPING[team]}: ${odds}`);
      }
    });

    // odds.json 생성
    const oddsData = {
      lastUpdated: new Date().toISOString(),
      source: 'oddschecker.com',
      odds: participantOdds,
      allTeams: allTeams.map(({ team, odds }) => ({
        team,
        abbr: TEAM_MAPPING[team] || null,
        odds
      }))
    };

    // 파일 저장
    const outputPath = path.join(__dirname, '..', 'odds.json');
    fs.writeFileSync(outputPath, JSON.stringify(oddsData, null, 2));
    console.log(`\n✅ Saved to ${outputPath}`);
    console.log(`📅 Last updated: ${oddsData.lastUpdated}`);

  } catch (error) {
    console.error('❌ Error fetching odds:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

fetchOdds();
