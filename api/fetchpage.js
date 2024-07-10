import puppeteer from "puppeteer";

export const fetchPageData = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");

  // Disable loading unnecessary resources
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.goto(url, { waitUntil: 'networkidle2' });

  const data = await page.evaluate(async () => {
    const data = [];

    const waitForImages = async () => {
      await new Promise((resolve) => {
        const distance = 100; // should be less than or equal to window.innerHeight
        const delay = 100;
        const timer = setInterval(() => {
          document.scrollingElement.scrollBy(0, distance);
          if (document.scrollingElement.scrollTop + window.innerHeight >= document.scrollingElement.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, delay);
      });
      await new Promise((resolve) => setTimeout(resolve, 50)); // additional wait time for images to load
    };

    const extractData = () => {
      document.querySelectorAll(".a37d52f0").forEach((element) => {
        let imgElement = element.firstChild.children[1]?.firstChild?.firstChild?.querySelector('img');
        let imgURL = imgElement ? imgElement.src : null;

        if (!imgURL) {
          imgElement = element.firstChild.children[1]?.firstChild?.firstChild?.querySelector('source');
          imgURL = imgElement ? imgElement.srcset.split(",")[0].split(" ")[0] : null;
        }

        const location = element.firstChild.lastChild?.children[2]?.children[2]?.textContent.trim();
        const title = element.firstChild.lastChild?.children[2]?.children[1]?.textContent.trim();
        const price = element.firstChild.lastChild.children[1]?.textContent.trim();
        const anchorElement = element.querySelector('a');
        const propertyURL = anchorElement ? anchorElement.href : null;

        data.push({
          imageURL: imgURL,
          location,
          title,
          price,
          propertyURL,
        });
      });
    };

    await waitForImages();
    extractData();

    let nextBtn = document.querySelector('[role="navigation"]').children[0].lastChild.children[0];
    while (nextBtn?.getAttribute("title") === "Next") {
      nextBtn.click();
      await waitForImages();
      await waitForImages();
      extractData();
      nextBtn = document.querySelector('[role="navigation"]').children[0].lastChild.children[0];
    }

    return data;
  });

  // Function to get permit number for a single property URL
  const getPermitNumber = async (propertyURL) => {
    const page = await browser.newPage();
    await page.goto(propertyURL, { waitUntil: 'networkidle2' });

    const permitNumber = await page.evaluate(() => {
      const parentElement = document.querySelector('._4c129399');
      if (!parentElement) return null;

      const divs = parentElement.querySelectorAll('._34032b68');
      if (divs.length < 2) return null;

      const targetDiv = divs[divs.length - 2];
      const span = targetDiv.querySelector('span');
      return span ? span.textContent.trim() : null;
    });

    await page.close();
    return permitNumber;
  };

  // Process property URLs in parallel with retry logic
  const permitNumberPromises = data.map(async (property) => {
    if (property.propertyURL) {
      let permitNumber = null;
      for (let attempt = 0; attempt < 3; attempt++) { // Retry up to 3 times
        try {
          permitNumber = await getPermitNumber(property.propertyURL);
          if (permitNumber) break;
        } catch (error) {
          console.error(`Error fetching permit number for ${property.propertyURL}, attempt ${attempt + 1}:`, error);
        }
      }
      return {
          imageURL: property.imageURL,
          location: property.location,
          title: property.title,
          price: property.price,
          permit_number: permitNumber,
      };
    }
  });

  const updatedData = await Promise.all(permitNumberPromises);

  await browser.close();

  // Convert data to desired format: key as permit_number and value as other data

  return updatedData;
};