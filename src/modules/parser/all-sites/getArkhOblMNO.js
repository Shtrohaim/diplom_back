import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';
import changeNumMonth from '../constant/changeNumMonth.js';

const scraperObject = {
    url: 'https://www.arkh-edu.ru/index.php',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.news-list');
		// Get the link to all the required books
		let urls = await page.$$eval('.news-list .news-item', links => {
			links = links.map(el => el.querySelector('a:nth-child(1)').href)
			return links;
		});


		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
                waitUntil: 'load',
                timeout: 0
            });
    
            dataObj['newsTittle'] = await newPage.$eval('.news-detail h3', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			
            dataObj['newsDate'] = await newPage.$eval('.news-detail .news-date-time', text => text.textContent);
            dataObj['newsDate'] = changeNumMonth.changeMonth(dataObj['newsDate']);

	        dataObj['imageUrl'] = []

			dataObj['newsDesc'] = await newPage.$eval('.news-detail', div => {
				div = [ div.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim() ]
				return div;
			});
            
            dataObj['newsDesc'] = [ dataObj['newsDesc'][0].split(dataObj['newsTittle'])[1] ]

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_arkhobl_mno').then((res) =>{
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
			createTable(scrapedData, 'news_arkhobl_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 