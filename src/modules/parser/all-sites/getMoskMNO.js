import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const scraperObject = {
    url: 'https://mo.mosreg.ru/sobytiya/novosti-ministerstva',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.page__content');
		// Get the link to all the required books
		let urls = await page.$$eval('.news-list-page__list .news-list-page__item .event__title', links => {
			links = links.map(el => el.querySelector('a').href)
			return links;
		});


		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});
			dataObj['newsTittle'] = await newPage.$eval('.page__header h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			dataObj['newsDate'] = await newPage.$eval('.article__pubdate .article__pubdate-day', text => text.textContent);

            dataObj['newsDate'] += " " + await newPage.$eval('.article__pubdate .article__pubdate-year', text => text.textContent);

	        let allImages = await newPage.$$eval('.article__inner img', img => {
                img = img.map(el => el.src);
                return img
            });

			dataObj['imageUrl'] = []
			allImages.forEach((element) => {
				if (!dataObj['imageUrl'].includes(element)) {
					dataObj['imageUrl'].push(element);
				}
			});

			dataObj['newsDesc'] = await newPage.$$eval('.article__inner p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim())
				return div;
			});

			if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.article__inner', div => [ div.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim()])
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_mosk_mno').then((res) =>{
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
			createTable(scrapedData, 'news_mosk_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 