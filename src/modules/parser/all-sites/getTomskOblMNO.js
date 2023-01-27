import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const scraperObject = {
    url: 'https://edu.tomsk.gov.ru/news/front',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.news_list');
		// Get the link to all the required books
		let urls = await page.$$eval('.news_list li > div', links => {
			links = links.map(el => el.querySelector('a').href)
			return links;
		});

        let dates = await page.$$eval('.news_list li > div', links => {
			links = links.map(el => el.querySelector('.date').textContent.split(',')[0])
			return links;
		});

		let pagePromise = (link, date) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});

			dataObj['newsTittle'] = await newPage.$eval('.content h2', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			
			dataObj['newsDate'] = date;

            dataObj['imageUrl'] = await newPage.$$eval('.gallery-content > div a', img => {
                img = img.map(el => el.href);
                return img
            });
         
			dataObj['newsDesc'] = await newPage.$$eval('.text_body p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim());
				return div;  
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.text_body', div => [ div.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim() ]);
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
        dates = dates.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_tomskobl_mno').then((res) =>{
				check[urls[link]] = res
			}).catch((err) => {
				console.log("Promise checkTable error: " + err);
			})

			if(check[urls[link]]){
				let currentPageData = await pagePromise(urls[link], dates[link]);
				scrapedData.push(currentPageData)
			}
		
		}
		if(scrapedData.length !== 0){
			createTable(scrapedData, 'news_tomskobl_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 