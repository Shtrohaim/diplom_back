import * as pageScraper from '../modules/parser/all-sites/index.js';

export default async function scrapeAll(browserInstance){
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

