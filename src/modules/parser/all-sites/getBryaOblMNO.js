import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';
import changeNumMonth from '../constant/changeNumMonth.js';

const scraperObject = {
    url: 'http://newhq.b-edu.ru/novosti/',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.news-inner');
		// Get the link to all the required books
		let urls = await page.$$eval('.news-inner .news-inner__item', links => {
			links = links.map(el => el.querySelector('.news-inner__img').href)
			return links;
		});


		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});

			dataObj['newsTittle'] = await newPage.$eval('.blog-content h2', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			
			dataObj['newsDate'] = await newPage.$eval('.news-inner__date', text => text.textContent);
            dataObj['newsDate'] = changeNumMonth.changeMonth(dataObj['newsDate']);

	        dataObj['imageUrl'] = await newPage.$$eval('.details-slider-wrap .swiper-slide a', img => {
                img = img.map(el => el.href);
                return img
            });

            dataObj['imageUrl'].push(await newPage.$eval('.news-img img', text => text.src));

			dataObj['newsDesc'] = await newPage.$$eval('.details-content p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim());
				return div;
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.details-content', div => [ div.textContent ] );
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_bryaobl_mno').then((res) =>{
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
			createTable(scrapedData, 'news_bryaobl_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 