import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';
import changeShortStrMonth from '../constant/changeShortStrMonth.js';

const scraperObject = {
    url: 'https://gov.karelia.ru/news/?news_source=26',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.page');
		// Get the link to all the required books
		let urls = await page.$$eval('.focus-panel', links => {
			links = links.map(el => el.querySelector('a').href)
			return links;
		});

		let date = await page.$$eval('.focus-panel .panel-info__date', text => {
			text = text.map(el => el.textContent)
			return text;
		});


		let pagePromise = (link, date) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
                waitUntil: 'load',
                timeout: 0
            });
			dataObj['newsTittle'] = await newPage.$eval('.container > .wrapper > h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			
			dataObj['newsDate'] = changeShortStrMonth.changeMonth(date);
			
	        dataObj['imageUrl'] = await newPage.$$eval('.carousel__inner .carousel__item img', img => {
                img = img.map(el => el.src);
                return img
            });

			dataObj['newsDesc'] = await newPage.$$eval('.container > .wrapper > .news-detail > div:not(.carousel), .container > .wrapper > .news-detail > p, .container > .wrapper > .news-detail > em', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim())
				return div;
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.container > .wrapper > .news-detail', div => [ div.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim()])
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		date = date.reverse();

		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_karelia_mno').then((res) =>{
				check[urls[link]] = res
			}).catch((err) => {
				console.log("Promise checkTable error: " + err);
			})

			if(check[urls[link]]){
				let currentPageData = await pagePromise(urls[link], date[link]);
				scrapedData.push(currentPageData)
			}
		
		}
		if(scrapedData.length !== 0){
			createTable(scrapedData, 'news_karelia_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 