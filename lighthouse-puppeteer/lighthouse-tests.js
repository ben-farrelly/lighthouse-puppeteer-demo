const chromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const config = require('lighthouse/lighthouse-core/config/lr-desktop-config.js');
const reportGenerator = require('lighthouse/lighthouse-core/report/report-generator');
const request = require('request');
const util = require('util');
const fs = require('fs');

(async() => {

    // const loginURL = 'https://serato.com/'; //https://idp.nature.com/login/natureuser';
    const logoutURL = 'https://idp.nature.com/logout/natureuser?redirect_uri=https%3A%2F%2Fwww.nature.com';

    const testingUrls = [
        'https://serato.com/',
        'https://serato.com/dj/pro',
        'https://serato.com/dj/pricing',
        'https://serato.com/studio',
        'https://serato.com/sounds',
        'https://serato.com/studio/downloads',
        'https://serato.com/beatfighter',
        'https://serato.com/campaign/play-for-pro',
        'https://serato.com/checkout/cart/item/add/58',
        'https://serato.com/login'
    ];
    // todo - add scripts for authenticated views. My Account, Payment page?
    const opts = {
        chromeFlags: ['--headless'],
        logLevel: 'info',
        output: 'json',
        disableDeviceEmulation: true,
        defaultViewport: {
            width: 1200,
            height: 900
        },
    };

// Launch chrome using chrome-launcher
    const chrome = await chromeLauncher.launch(opts);
    opts.port = chrome.port;

// Connect to it using puppeteer.connect().
    const resp = await util.promisify(request)(`http://localhost:${opts.port}/json/version`);
    const {webSocketDebuggerUrl} = JSON.parse(resp.body);
    const browser = await puppeteer.connect({browserWSEndpoint: webSocketDebuggerUrl});


    page = (await browser.pages())[0];
    await page.setViewport({ width: 1200, height: 900 });

    for (let index = 0; index < testingUrls.length; index++) {
        let url = testingUrls[index];
        
        
    //Puppeteer
        
        await page.goto(url, {waitUntil: 'networkidle2'});
        // await page.type('[id="email"]', 'benjamin.farrelly@serato.com');
        // await page.type('[id="password"]', 'Quilombo19');
        // await page.evaluate(() => {
        //     document.querySelector('[type="submit"]').click();
        // });

        // await page.waitForNavigation();

        console.log(page.url());

    // Run Lighthouse.
        try {
            const report = await lighthouse(page.url(), opts, config).then(results => {
                return results;
            });
            const html = reportGenerator.generateReport(report.lhr, 'html');
            const json = reportGenerator.generateReport(report.lhr, 'json');

            // console.log(`Lighthouse score: ${report.lhr.score}`);
            // await page.goto(logoutURL, {waitUntil: 'networkidle2'});
            //Write report html to the file

            // Todo push these reports into a manipulation queue
            fs.writeFile('report-' + index + '.html', html, (err) => {
                if (err) {
                    console.error(err);
                }
            });

            //Write report json to the file
            fs.writeFile('report-' + index + '.json', json, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        } catch (err) {
            console.error(err)
        }
    }

    await browser.disconnect();
    await chrome.kill();


   

})();