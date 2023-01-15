import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const scraperObject = {
    url: 'https://mari-el.gov.ru/ministries/minobr/news/',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.newslist__body');
		// Get the link to all the required books
		let urls = await page.$$eval('.newslist__body .newslist__body-box', links => {
			links = links.map(el => el.querySelector('.newslist-card__title a').href)
			return links;
		});


		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
                waitUntil: 'load',
                timeout: 0
            });
			dataObj['newsTittle'] = await newPage.$eval('.page-layout__main h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			dataObj['newsDate'] = await newPage.$eval('.detailed-page__date time', text => text.textContent.split('г.')[0]);

	        dataObj['imageUrl'] = await newPage.$$eval('.detailed-page-slider img', img => {
                img = img.map(el => el.src);
                return img
            })

			dataObj['newsDesc'] = await newPage.$$eval('.wrapper-center-text p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim())
				return div;
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.wrapper-center-text', div => [ div.textContent.replace(/((\d\d)\.(\d\d)\.(\d\d\d\d))|(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim() ]);
            }
            
			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();

		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_mari_mno').then((res) =>{
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
			createTable(scrapedData, 'news_mari_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 