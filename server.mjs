import express from "express";
import puppeteer from "puppeteer";

const app = express();
const port = 3000;

const fgOK = "\x1b[36m%s\x1b[0m";
const fgWarning = "\x1b[33m%s\x1b[0m";
const fgError = "\x1b[31m%s\x1b[0m";
const fgFunction = "\x1b[34m%s\x1b[0m";
const fgRequest = "\x1b[37m%s\x1b[0m";
const fgCron = "\x1b[35m%s\x1b[0m";

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res) => {
  res.send("¯_(ツ)_/¯");
});

app.post("/api/v1/getWazeData", (req, res) => {
  const url = req.query.url;

  console.log(" ");
  console.log(fgRequest, "Request POST /getWazeData");
  console.log(
    fgRequest,
    "-------------------------------------------------------------------------------------------------------------------"
  );
  console.log(" ");
  console.log(fgOK, "incoming post getWazeData", url);

  puppeteer
    .launch()
    .then(async (browser) => {
      const page = await browser.newPage();
      await page.goto(url);

      //Wait for the page to be loaded
      await page.waitForSelector(".wz-share-drive-card__address", {
        timeout: 3000,
      });

      let text = await page.evaluate(() => {
        const address = document.body.querySelector(
          ".wz-share-drive-card__address-street"
        ).innerText;
        const addressNoSpacesOrCommas = address.replace(/[\s,]/g, "");

        const addressFull = document.body.querySelector(
          ".wz-share-drive-card__address"
        );

        const time = document.body.querySelector(
          ".wz-share-drive-card__arrival-time"
        );

        return {
          address: addressNoSpacesOrCommas,
          addressFull: addressFull.innerText,
          arrivalTime: time.innerText,
        };
      });

      const { address, addressFull, arrivalTime } = text;
      const eta = to24HrTime(arrivalTime);

      console.log({ address, addressFull, eta, url });

      res.send({ status: "ok", data: { address, addressFull, eta, url } });

      await browser.close();
    })
    .catch((error) => {
      console.error("Error: ", error);
      res.send({ status: "failed", error: error.message });
    });
});

/* Convert h:mm a/p to H:mm
 * i.e. 12 hour time to 24 hour time
 * @param {string} time - h:mm a/p format
 * @returns {string} time in H:mm format
 */
function to24HrTime(time) {
  let [hr, min, ap] = time.toLowerCase().match(/\d+|[a-z]+/g) || [];
  let hrWithLeadingZero = ((hr % 12) + (ap == "am" ? 0 : 12))
    .toString()
    .padStart(2, "0");
  return `${hrWithLeadingZero}:${min}`;
}
