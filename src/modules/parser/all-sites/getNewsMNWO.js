import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const scraperObject = {
    url: 'https://minobrnauki.gov.ru/press-center/news/',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.news-items');
		// Get the link to all the required books
		let urls = await page.$$eval('.news-item', links => {
			links = links.map(el => el.querySelector('a').href)
			return links;
		});


        // Loop through each of those links, open a new page instance and get the relevant data from them
		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});
			dataObj['newsTittle'] = await newPage.$eval('h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			dataObj['newsDate'] = await newPage.$eval('.post-date-day_', text => text.textContent + " " + new Date().getFullYear());
			dataObj['imageUrl'] = await newPage.$$eval('.post-section .container img', img => {
                img = img.map(el => el.src)
                return img;
            });	
			dataObj['newsDesc'] = await newPage.$$eval('.post-body p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim())
				return div;
			});
			if(dataObj['newsDesc'].length === 0){

				dataObj['newsDesc'] = await newPage.$eval('.post-body', div => [ div.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim() ]);
            }
			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_rus_mno').then((res) =>{
				check[urls[link]] = res
			}).catch((err) => {
				console.log("Promise checkTable error: " + err);
			})

			if(check[urls[link]]){
				let currentPageData = await pagePromise(urls[link]);
				scrapedData.push(currentPageData)
			}
		
		}
		if(scrapedData.length !== 0){
			createTable(scrapedData, 'news_rus_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 