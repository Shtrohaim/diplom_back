import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';
import changeNumMonth from '../constant/changeNumMonth.js';

const scraperObject = {
    url: 'http://edu53.ru/news/5/',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.rightBottomBoxBottom');
		// Get the link to all the required books
		let urls = await page.$$eval('.rightBottomBoxBottom .newsListItem', links => {
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

			dataObj['newsTittle'] = await newPage.$eval('.np_content td:last-child .rightBottomBoxBottom h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			
			dataObj['newsDate'] = await newPage.$$eval('.np_content td:last-child .rightBottomBoxBottom b', text => text[0].textContent);
            dataObj['newsDate'] = changeNumMonth.changeMonth(dataObj['newsDate']);

            dataObj['imageUrl'] = await newPage.$$eval('.np_content td:last-child .rightBottomBoxBottom img', img => {
                img = img.map(el => el.src);
                return img
            });
         
			dataObj['newsDesc'] = await newPage.$$eval('.np_content td:last-child .rightBottomBoxBottom > p', div => {
				div = div.map(el => {
                    if(el.querySelector('b') === null){
                       el = el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim()
                    }else{
                        el = ""
                    }
                    return el
                });
				return div;
			});

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_novgorobl_mno').then((res) =>{
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
			createTable(scrapedData, 'news_novgorobl_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 