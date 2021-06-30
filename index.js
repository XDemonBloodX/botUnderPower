const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

/* DATABASE*/
const mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);
console.log('connect db', 1);
mongoose.connect("mongodb://localhost:27017/" + "underPower", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    //If it connects log the following
    console.log("Connected to the Mongodb database.", "log");
}).catch((err) => {
    console.log("Unable to connect to the Mongodb database. Error:" + err, "error");
});
const Schema = mongoose.Schema;
const underPowerSchema = new Schema({
    nameCountry: {
        type: String
    },
    power: {
        type: Number
    },
    claims: {
        type: Number
    }
}, {
    timestamps: true
});
/* ----------*/

// compile schema to model
let underPower = mongoose.model('Chill', underPowerSchema, 'underPower');

puppeteer.use(StealthPlugin());
puppeteer.launch({
    headless: true,
    args: [
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36"
    ]
}).then(async browser => {
    console.log('✷ Running browser..')

    const page = await browser.newPage()
    await page.goto('https://nationsglory.fr/server/yellow/countries')
    await page.waitForTimeout(8000)

    const hrefs = await page.$$eval("tr > td > a", (list) => list.map((elm) => elm.href));
    const links = [];

    hrefs.forEach(hf => {
        if (hf.startsWith('https://nationsglory.fr/country/yellow/') == true) {
            links.push(hf)
        }
    });
    const linkLength = links.length / 2;
    for (let i = 0; i < linkLength; i++) {
        let pay = links[i].substring(39, links[i].length)

        await page.goto(links[i])
        await page.waitForTimeout(1000);
        const claims = await page.evaluate(() => Array.from(document.querySelectorAll(".mb-2"), element => element.textContent));
        const powers = await page.evaluate(() => Array.from(document.querySelectorAll(".col-md-3 > .mb-2"), element => element.textContent));

        let power = powers[1].split("/");
        let claim = claims[4];
        power = parseInt(power[0], 10)
        claim = parseInt(claim, 10)
        console.log(pay, power, claim)

        if (power < claim) {
            let uP = new underPower({ nameCountry: pay, power: power, claims: claim });
            uP.save(function(err, book) {
                if (err) return console.error(err);
                console.log(uP.nameCountry + " saved to collection.");
            });
        }
    }
    await browser.close()
    console.log("✨All done, check the console✨");
})