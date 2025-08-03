const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  const page = await context.newPage()
  const baseURL = 'http://localhost:3219'

  await page.goto(baseURL + '/book/')
  await page.pdf({ path: `Tomasino_TUVOLO_${getDate()}.pdf` });

  await browser.close()
})()

function getDate() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const filename =
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate())
  return filename;
}
