const { BrowserWindow, app, ipcMain } = require("electron");
const pie = require("puppeteer-in-electron");
const fs = require("fs");
const { stringify } = require("csv-stringify");

var terminatingcond = true;

const scrape = async (url, win) => {
  var puppeteer = require("puppeteer");
  var browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ["--start-maximized"],
  });
  var page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36"
  );
  await page.goto(url, { waitUntil: "load" });
  var allData = [
    [
      "Title",
      "Sub_title",
      "City",
      "Picture Link",
      "Property ID",
      "Property Link",
      "Beds",
      "Bedrooms",
      "Price",
      "Original Price",
      "Pricing Criteria",
      "Rating",
      "No Of Reviews",
      "Availability",
      "Room Type Category",
      "Longitude",
      "Latitude",
      "Total Guests",
      "Adults",
      "Children",
      "Pets",
      "Infants",
      "CheckIn",
      "CheckOut",
      "Reviews",
    ],
  ];
  var city;
  var pictureLink;
  var sub_title;
  var title;
  var longitude;
  var latitude;
  var propertyID;
  var roomTypeCategory;
  var beds;
  var bedrooms;
  var price;
  var originalPrice;
  var availability;
  var pricingCriteria;
  var noOfReviews;
  var rating;
  var propertyLink;
  var adults;
  var children;
  var infants;
  var pets;
  var checkIn;
  var checkOut;
  var totalGuests;
  var reviewsComment;
  var URL = url;

  adults = null;
  children = null;
  infants = null;
  pets = null;
  checkIn = null;
  checkOut = null;
  totalGuests = null;
  var URL_parts = URL.split("&");
  for (let index = 0; index < URL_parts.length; index++) {
    const element = URL_parts[index];
    if (element.includes("adult")) {
      adults = element.split("=")[1];
    } else if (element.includes("children")) {
      children = element.split("=")[1];
    } else if (element.includes("infant")) {
      infants = element.split("=")[1];
    } else if (element.includes("pets")) {
      pets = element.split("=")[1];
    } else if (element.includes("checkin")) {
      checkIn = element.split("=")[1];
    } else if (element.includes("checkout")) {
      checkOut = element.split("=")[1];
    }
  }
  totalGuests = parseInt(adults) + parseInt(children);
  await page.waitForXPath(
    '//nav[@aria-label="Search results pagination"]//a[last()-1]',
    { timeout: 60000 }
  );
  var totalPages = await page.evaluate(() => {
    return parseInt(
      document.evaluate(
        '//nav[@aria-label="Search results pagination"]//a[last()-1]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue.textContent
    );
  });

  for (let index = 0; index < totalPages; index++) {
    if (terminatingcond) {
      console.log(index + 1);
      await page.evaluate(() => {
        location.reload(true);
      });
      await page.waitForXPath('//script[@id="data-deferred-state"]', {
        timeout: 60000,
      });
      await page.waitForFunction(
        () => {
          try {
            JSON.parse(
              document.getElementById("data-deferred-state").textContent
            ).niobeMinimalClientData[0][1].data.presentation.explore.sections
              .sectionIndependentData.staysSearch.searchResults;
            return true;
          } catch {
            return false;
          }
        },
        { timeout: 60000 }
      );

      var data = await page.evaluate(async () => {
        // try{
        return JSON.parse(
          document.getElementById("data-deferred-state").textContent
        ).niobeMinimalClientData[0][1].data.presentation.explore.sections
          .sectionIndependentData.staysSearch.searchResults;
        // }
        // catch{
        //   await new Promise(r => setTimeout(r, 3000));
        //   return JSON.parse(
        //     document.getElementById("data-deferred-state").textContent
        //   ).niobeMinimalClientData[0][1].data.presentation.explore.sections
        //     .sectionIndependentData.staysSearch.searchResults;
        //   }
      });
      for (let i = 0; i < data.length; i++) {
        try {
          city = data[i]["listing"]["city"];
        } catch {
          city = "";
        }
        try {
          pictureLink = data[i]["listing"]["contextualPictures"][0]["picture"];
        } catch {
          pictureLink = "";
        }
        try {
          sub_title = data[i]["listing"]["name"];
        } catch {
          sub_title = "";
        }
        try {
          title = data[i]["listing"]["title"];
        } catch {
          title = "";
        }
        try {
          longitude = data[i]["listing"]["coordinate"]["longitude"];
        } catch {
          longitude = "";
        }
        try {
          latitude = data[i]["listing"]["coordinate"]["latitude"];
        } catch {
          latitude = "";
        }
        try {
          propertyID = data[i]["listing"]["id"].toString();
        } catch {
          continue;
        }
        try {
          roomTypeCategory = data[i]["listing"]["roomTypeCategory"];
        } catch {
          roomTypeCategory = "";
        }
        try {
          beds =
            data[i]["listing"]["structuredContent"]["primaryLine"][0]["body"];
        } catch {
          beds = "";
        }
        try {
          bedrooms =
            data[i]["listing"]["structuredContent"]["primaryLine"][1]["body"];
        } catch {
          bedrooms = "";
        }
        try {
          availability =
            data[i]["listing"]["structuredContent"]["secondaryLine"][0]["body"];
        } catch {
          availability = "";
        }
        if (
          data[i]["pricingQuote"]["structuredStayDisplayPrice"]["primaryLine"][
            "accessibilityLabel"
          ].includes("originally")
        ) {
          price =
            data[i]["pricingQuote"]["structuredStayDisplayPrice"][
              "primaryLine"
            ]["discountedPrice"];
          originalPrice =
            data[i]["pricingQuote"]["structuredStayDisplayPrice"][
              "primaryLine"
            ]["originalPrice"];
        } else {
          price =
            data[i]["pricingQuote"]["structuredStayDisplayPrice"][
              "primaryLine"
            ]["price"];
          originalPrice = " ";
        }
        pricingCriteria =
          data[i]["pricingQuote"]["structuredStayDisplayPrice"]["primaryLine"][
            "qualifier"
          ];
        if (data[i]["listing"]["avgRatingLocalized"]) {
          if (data[i]["listing"]["avgRatingLocalized"].split(" ").length > 1) {
            rating = data[i]["listing"]["avgRatingLocalized"].split(" ")[0];
            noOfReviews = data[i]["listing"]["avgRatingLocalized"]
              .split(" ")[1]
              .replace("(", "")
              .replace(")", "");
          } else {
            rating = " ";
            noOfReviews = " ";
          }
        } else {
          rating = " ";
          noOfReviews = " ";
        }
        propertyLink = "https://www.airbnb.com/rooms/" + propertyID;
        reviewsData = await page.evaluate(async (roomid) => {
          var url = `https://www.airbnb.com/api/v3/PdpReviews?operationName=PdpReviews&locale=en&currency=USD&variables={"request":{"fieldSelector":"for_p3_translation_only","limit":1000,"listingId":${roomid}}}&extensions={"persistedQuery":{"version":1,"sha256Hash":"6a71d7bc44d1f4f16cced238325ced8a93e08ea901270a3f242fd29ff02e8a3a"}}`;
          var datas;
          await fetch(url, {
            headers: {
              "content-type": "application/json",
              "device-memory": "8",
              dpr: "1",
              ect: "4g",
              "sec-ch-ua":
                '"Not-A.Brand";v="99", "Opera GX";v="91", "Chromium";v="105"',
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": '"Windows"',
              "viewport-width": "1534",
              "x-airbnb-api-key": "d306zoyjsyarp7ifhu67rjxn52tv0t20",
              "x-airbnb-graphql-platform": "web",
              "x-airbnb-graphql-platform-client": "minimalist-niobe",
              "x-airbnb-supports-airlock-v2": "true",
            },
            referrer: `https://www.airbnb.com/rooms/${roomid}/reviews`,
            referrerPolicy: "strict-origin-when-cross-origin",
            body: null,
            method: "GET",
            mode: "cors",
            credentials: "omit",
          })
            .then((response) => response.json())
            .then((data) => (datas = data));
          return datas.data.merlin.pdpReviews.reviews;
        }, propertyID);
        reviewsComment = "";
        for (let index = 0; index < reviewsData.length; index++) {
          const element = reviewsData[index];
          try {
            if (element.language != "en") {
              reviewsComment =
                reviewsComment +
                `(${element.createdAt.split("T")[0]}) (rating:${
                  element.rating
                }) ` +
                element.localizedReview.comments.replace(/(<([^>]+)>)/gi, "") +
                " || ";
            } else {
              reviewsComment =
                reviewsComment +
                `(${element.createdAt.split("T")[0]}) (rating:${
                  element.rating
                }) ` +
                element.comments.replace(/(<([^>]+)>)/gi, "") +
                " || ";
            }
          } catch {}
        }
        reviewsComment = reviewsComment
          .trim()
          .replace(/([|][|])$/g, "")
          .trim();
        // console.log(reviewsComment)
        if (terminatingcond) {
          win.webContents.send("addData", [
            title,
            sub_title,
            city,
            `${price} per ${pricingCriteria}`,
            beds,
            bedrooms,
            availability == "" ? "Yes" : availability,
            rating,
            longitude,
            latitude,
            propertyLink,
            reviewsComment
              .split("||")
              .reduce((a, b) => (a.length <= b.length ? a : b)),
            // reviewsComment.split("||")[0].trim(),
          ]);
          allData.push([
            title,
            sub_title,
            city,
            pictureLink,
            propertyID,
            propertyLink,
            beds,
            bedrooms,
            price,
            originalPrice,
            pricingCriteria,
            rating,
            noOfReviews,
            availability,
            roomTypeCategory,
            longitude,
            latitude,
            totalGuests,
            adults,
            children,
            pets,
            infants,
            checkIn,
            checkOut,
            reviewsComment,
          ]);
        } else {
          break;
        }
      }
      if (index + 1 == totalPages) {
        break;
      }

      await page.waitForSelector('a[aria-label="Next"]', { timeout: 60000 });
      await page.click('a[aria-label="Next"]');
      await new Promise((r) => setTimeout(r, 5000));
    } else {
      break;
    }
  }
  // console.log(allData);
  await browser.close();
  //   console.log(allData);
  return allData;
  // await fs.writeFile("data.csv", allData);
};
const makecsv = async (data) => {
  // console.log(data);
  if (data.length > 1) {
    const filename = "data.csv";
    const writableStream = fs.createWriteStream(filename);
    const columns = [
      "Title",
      "Sub_title",
      "City",
      "Picture Link",
      "Property ID",
      "Property Link",
      "Beds",
      "Bedrooms",
      "Price",
      "Original Price",
      "Pricing Criteria",
      "Rating",
      "No Of Reviews",
      "Availability",
      "Room Type Category",
      "Longitude",
      "Latitude",
      "Total Guests",
      "Adults",
      "Children",
      "Pets",
      "Infants",
      "CheckIn",
      "CheckOut",
      "Reviews",
    ];
    const stringifier = stringify({
      header: true,
      columns: columns,
      bom: true,
    });
    for (let i = 1; i < data.length; i++) {
      await stringifier.write(data[i]);
    }
    await stringifier.pipe(writableStream);
  }
};
const main = async () => {
  var puppeteer = require("puppeteer-core");
  await pie.initialize(app);
  var browser = await pie.connect(app, puppeteer);
  var airbnbdata;

  const window = new BrowserWindow({
    width: 800,
    height: 600,
    // resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      //   preload: path.join(__dirname, "preload.js"),
    },
  });
  window.maximize();
  const url = "https://www.airbnb.com/";
  await window.loadURL(url);

  var page = await pie.getPage(browser, window);
  let holdProgress = true;
  while (holdProgress) {
    await page.waitForTimeout(300);
    if (page.url().includes("airbnb.com/s/")) {
      holdProgress = false;
    }
  }
  await page.waitForXPath(
    '//div[@data-plugin-in-point-id="EXPLORE_HEADER"]/../../..'
  );
  await page.waitForXPath("//footer/../../../../../../..");
  await page.waitForXPath(
    '//h1[@elementtiming="LCP-target"]/../../../../../../..'
  );

  await page.evaluate(() => {
    const ipcRenderer = require("electron").ipcRenderer;

    const run = () => {
      ipcRenderer.send("run", window.location.href);
    };
    function getElementByXpath(path) {
      return document.evaluate(
        path,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
    }
    getElementByXpath(
      '//div[@data-plugin-in-point-id="EXPLORE_HEADER"]/../../..'
    ).remove();
    getElementByXpath(
      '//h1[@elementtiming="LCP-target"]/../../../../../..'
    ).remove();
    getElementByXpath("//footer/../../../../../../..").remove();
    // document.querySelector('div[data-testid="little-search-icon"]').onclick=
    var element = document.createElement("button");
    element.id = "hello";
    element.innerText = "Start Scraping";
    element.style.width = "150px";
    element.style.height = "70px";
    element.style.backgroundColor = "#FF385C";
    element.style.color = "white";
    element.style.position = "fixed";
    element.style.bottom = "0";
    element.style.right = "0";
    element.style.border = "1px solid";
    element.style.borderRadius = "10px";
    element.style.cursor = "pointer";
    element.style.zIndex = "20";
    element.style.fontSize = "16px";
    element.style.fontWeight = "600";
    // var handleClick = () => {
    //   console.log("Owias");
    //   console.log("url>> ", decodeURIComponent(window.location.href));
    // };
    element.onclick = run;

    document.body.appendChild(element);
  });

  ipcMain.on("run", async (event, data) => {
    console.log(data);
    await window.loadFile("index.html");
    console.log("hamza");
    airbnbdata = await scrape(data, window);

    window.webContents.send("scraped");
    // var value = await facebook();
    // console.log(value);
    // await fs.writeFile("data.json", JSON.stringify(value));
    //
  });

  ipcMain.on("makecsv", async (event) => {
    await makecsv(airbnbdata);
    window.webContents.send("generatedcsv");
    // window.destroy();
  });

  ipcMain.on("terminate", async (event) => {
    terminatingcond = false;
  });

  //   console.log(page.url());
  //   window.destroy();
};

main();
