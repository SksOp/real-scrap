import puppeteer from 'puppeteer';

export const fetchPageData = async (url) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  );

  await page.goto(url, { waitUntil: 'networkidle2' });

  const propertyLinks = [];

  const extractPropertyLinks = async () => {
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.a37d52f0 a')).map(anchor => anchor.href);
    });
    propertyLinks.push(...links);
  };

  let hasNext = true;
  while (hasNext) {
    await extractPropertyLinks();

    hasNext = await page.evaluate(() => {
      const nextBtn = document.querySelector('[role="navigation"]').children[0].lastChild.children[0];
      if (nextBtn && nextBtn.getAttribute('title') === 'Next') {
        nextBtn.click();
        return true;
      }
      return false;
    });

    if (hasNext) {
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
  }

  const data = [];

  const n = propertyLinks.length;

let i = 0;
while (i < n) {
  // Open pages concurrently
  const pages = await Promise.all([
    browser.newPage(),
    i + 1 < n ? browser.newPage() : null,
    i + 2 < n ? browser.newPage() : null,
    i + 3 < n ? browser.newPage() : null,
    i + 4 < n ? browser.newPage() : null
    
  ]);

  const blockResources = page => {
    return page.setRequestInterception(true).then(() => {
      page.on('request', request => {
        const resourceType = request.resourceType();
        if (['stylesheet', 'font', 'other'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });
    });
  };

  // Set user agents and block resources concurrently
  await Promise.all(pages.map(page => page && Promise.all([
    page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ),
    blockResources(page)
  ])));

  // Navigate to URLs concurrently
  await Promise.all([
    pages[0]?.goto(propertyLinks[i], { waitUntil: 'networkidle2' }),
    pages[1]?.goto(propertyLinks[i + 1], { waitUntil: 'networkidle2' }),
    pages[2]?.goto(propertyLinks[i + 2], { waitUntil: 'networkidle2' }),
    pages[3]?.goto(propertyLinks[i + 3], { waitUntil: 'networkidle2' }),
    pages[4]?.goto(propertyLinks[i + 4], { waitUntil: 'networkidle2' })
  ]);

  // Evaluate pages concurrently
  const propertyData = await Promise.all(pages.map(page => page && page.evaluate(() => {
    const image = document.querySelector("._0919f096 ._62f36f9e img")?.getAttribute("src") || null;
    const price = document.querySelector("._2d107f6e")?.textContent || null;
    const title = document.querySelector("._34032b68.dc0dc50b._701d0fe0 h1")?.textContent || null;
    const location = document.querySelector(".e4fd45f0")?.textContent || null;

    return { image, price, title, location };
  })));

  // Add the results to data array
  propertyData.forEach((datat) => datat && data.push(datat));

  // Close pages concurrently
  await Promise.all(pages.map(page => page && page.close()));

  i += 5;
}

  await browser.close();

  return data;
};
