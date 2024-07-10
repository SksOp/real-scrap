import puppeteer from "puppeteer";

export const fetchPageData = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
  await page.goto(url, { waitUntil: 'networkidle0' });

  const data = [];

  const extractData = async () => {
    const pageData = await page.evaluate(() => {
      const extractedData = [];
      document.querySelectorAll(".a37d52f0").forEach((element) => {
        let imgElement = element.querySelector('img');
        let imgURL = imgElement ? imgElement.src : null;
        
        if (!imgURL) {
          imgElement = element.querySelector('source');
          imgURL = imgElement ? imgElement.srcset.split(",")[0].split(" ")[0] : null;
        }

        const anchorElement = element.querySelector('a');
        const propertyURL = anchorElement ? anchorElement.href : null;
        
        const location = element.querySelector('.location-class')?.textContent.trim();
        const title = element.querySelector('.title-class')?.textContent.trim();
        const price = element.querySelector('.price-class')?.textContent.trim();
        
        extractedData.push({
          imageURL: imgURL,
          location,
          title,
          price,
          propertyURL,
        });
      });
      return extractedData;
    });
    data.push(...pageData);
  };

  // Extract data from the first page
  await extractData();

  // Handle pagination
  let hasNextPage = true;
  while (hasNextPage) {
    const nextButton = await page.evaluate(() => {
      const nextBtn = document.querySelector('[role="navigation"] [aria-label="Next"]');
      return nextBtn ? nextBtn.href : null;
    });

    if (nextButton) {
      await page.goto(nextButton, { waitUntil: 'networkidle0' });
      await extractData();
    } else {
      hasNextPage = false;
    }
  }

  await browser.close();
  return data;
};