import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';
import changeNumMonth from '../constant/changeNumMonth.js';

const scraperObject = {
    url: 'https://minobr.krasnodar.ru/news/common',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.news');
		// Get the link to all the required books
		let urls = await page.$$eval('.news .news__inner .news__news-tab .news-item', links => {
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

			dataObj['newsTittle'] = await newPage.$eval('.title-tabs .title', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
            
			dataObj['newsDate'] = await newPage.$eval('.news-detail-page__date', text => text.textContent.split(':')[1].trim());
            dataObj['newsDate'] = changeNumMonth.changeMonth(dataObj['newsDate']);

	        let allImages = await newPage.$$eval('.swiper > .swiper__container:not(.swiper__thumbs-container) > .swiper__wrapper > .swiper__slide img', img => {
                img = img.map(el => el.src);
                return img
            });

            dataObj['imageUrl'] = [];
            allImages.forEach((element) => {
                    if (!dataObj['imageUrl'].includes(element)) {
                        dataObj['imageUrl'].push(element);
                    }
            });

			dataObj['newsDesc'] = await newPage.$$eval('.news-detail-page__article > p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim());
				return div;
			});

			if(dataObj['newsDesc'].length === 0) {
				dataObj['newsDesc'] = await newPage.$$eval('.news-detail-page__article', div => {
					div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim());
					return div;
				});
			}

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_krasnodarkray_mno').then((res) =>{
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
			createTable(scrapedData, 'news_krasnodarkray_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 