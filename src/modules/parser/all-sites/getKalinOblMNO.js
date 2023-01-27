import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';
import changeNumMonth from '../constant/changeNumMonth.js';

const scraperObject = {
    url: 'https://edu.gov39.ru/news/index.php?sect=novosti',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.mm_news_list');
		// Get the link to all the required books
		let urls = await page.$$eval('.mm_news_list .mm_news_list-item .mm_news_list-item__link', links => {
			links = links.map(el => el.href)
			return links;
		});

		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});

			dataObj['newsTittle'] = await newPage.$eval('.mm_columns-item h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			
			dataObj['newsDate'] = await newPage.$eval('.mm_columns-item .mm_news-date', text => text.textContent);
            dataObj['newsDate'] = changeNumMonth.changeMonth(dataObj['newsDate']);

	        dataObj['imageUrl'] = await newPage.$$eval('.mm_columns-item img', img => {
                img = img.map(el => el.src);
                return img
            });
            
            dataObj['newsDesc'] = await newPage.$eval('.mm_columns-item > div', div => [ div.textContent.replace(/((\d\d)\.(\d\d)\.(\d\d\d\d))|(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim() ] );
          

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_kalinobl_mno').then((res) =>{
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
			createTable(scrapedData, 'news_kalinobl_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 