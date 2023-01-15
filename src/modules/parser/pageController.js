import * as pageScraper from './all-sites/index.js';

export default async function scrapeAll(browserInstance){
	let browser;
	try{
		browser = await browserInstance;
		for(let page in pageScraper){
			await pageScraper[page].scraperObject.scraper(browser);	
		}	
		browser.close();
	}
	catch(err){
		console.log("Could not resolve the browser instance => ", err);
	}
}

