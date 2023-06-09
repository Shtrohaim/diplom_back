import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';
import changeNumMonth from '../constant/changeNumMonth.js';

const scraperObject = {
    url: 'https://xn--80aakec5bilkue.xn--33-6kcadhwnl3cfdx.xn--p1ai/pres-tsentr/news/',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.child_content');
		// Get the link to all the required books
		let urls = await page.$$eval('.child_content .news-list .news-item', links => {
			links = links.map(el => el.querySelector('.news-item-image a').href)
			return links;
		});

        let titles = await page.$$eval('.child_content .news-list .news-item', links => {
			links = links.map(el => el.querySelector('.news-item-text .news-item-header').textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim())
			return links;
		});


		let pagePromise = (link, title) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});

			dataObj['newsTittle'] = title;
			
			dataObj['newsDate'] = await newPage.$eval('.news-date-time', text => text.textContent);
            dataObj['newsDate'] = changeNumMonth.changeMonth(dataObj['newsDate']);

	        dataObj['imageUrl'] = await newPage.$$eval('.news-detail-text img', img => {
                img = img.map(el => el.src);
                return img
            });

			dataObj['newsDesc'] = await newPage.$$eval('.news-detail-text p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim());
				return div;
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.news-detail-text', div => [ div.textContent ] );
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
        titles = titles.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_vladimobl_mno').then((res) =>{
				check[urls[link]] = res
			}).catch((err) => {
				console.log("Promise checkTable error: " + err);
			})

			if(check[urls[link]]){
				let currentPageData = await pagePromise(urls[link], titles[link]);
				scrapedData.push(currentPageData)
			}
		
		}
		if(scrapedData.length !== 0){
			createTable(scrapedData, 'news_vladimobl_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 