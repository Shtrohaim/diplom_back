import * as pageScraper from '../modules/parser/fipi/index.js';

export default async function scrapeFipi(browserInstance){
	let browser;
	for(let page in pageScraper){
		try{
			browser = await browserInstance;
			await pageScraper[page].scraperObject.scraper(browser);	
		}
		catch(err){
			console.log("Could not resolve the browser instance => ", err);
		}
	}
	browser.close();
}

