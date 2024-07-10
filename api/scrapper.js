import puppeteer from "puppeteer";

export const scrapePageData = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

  const initialData = await page.evaluate(async () => {
    const data = [];

    const extractData = () => {
      document.querySelectorAll("#card-list > div > .styles_desktop_container__V85pq > li")
        .forEach((element) => {
          const imgElement = element.querySelector("img[data-src], img[src]");
          const priceElement = element.querySelector(".styles-module_content__price-area__I0781 > p");
          const titleElement = element.querySelector("h2");
          const locationElement = element.querySelector(".styles-module_content__location-container__pRGhf > p");
          const articleElement = element.querySelector("article > a");

          data.push({
            imageURL: imgElement ? (imgElement.dataset.src || imgElement.src) : 'No image',
            price: priceElement ? priceElement.textContent.trim() : 'No price',
            title: titleElement ? titleElement.textContent.trim() : 'No title',
            location: locationElement ? locationElement.textContent.trim() : 'No location',
            articleURL: articleElement ? articleElement.href : 'No URL'
          });
        });
    };

    extractData(); // Extract initial page data

    // Simulation of clicking through pagination if necessary
    let nextButton = document.querySelector(".styles_pagination__e_iw6 > button:last-child");
    while (nextButton && !nextButton.disabled) {
      nextButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for the new page to load
      extractData(); // Extract data after each new page loads
      nextButton = document.querySelector(".styles_pagination__e_iw6 > button:last-child");
    }

    return data;
  });

  const finalData = [];

  // Now navigate to each article URL and scrape the dld_permit_number
  for (let item of initialData) {
    if (item.articleURL !== 'No URL') {
      await page.goto(item.articleURL, { waitUntil: "domcontentloaded", timeout: 0 });
      const dld_permit_number = await page.evaluate(() => {
        return document.querySelector(".styles_desktop_container__kcSkl .styles_desktop_content__Z_YaU .styles_desktop_link___qw0V .styles_desktop_value__mxst1")?.textContent || "No DLD Permit Number";
      });
      finalData.push({
        imageURL: item.imageURL,
        price: item.price,
        title: item.title,
        location: item.location,
        permit_number: dld_permit_number
      });
    } else {
      finalData.push({
        imageURL: item.imageURL,
        price: item.price,
        title: item.title,
        location: item.location,
        permit_number: ""
      });
    }
  }

  await browser.close();
  return finalData;
};