import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const scraperObject = {
    url: 'https://r-19.ru/news/education/',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.inner_content');
		// Get the link to all the required books
		let urls = await page.$$eval('.block_news_list .block_news_list_bb', links => {
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
			dataObj['newsTittle'] = await newPage.$eval('.inner_content h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			dataObj['newsDate'] = await newPage.$eval('.block_news_detail .block_news_detail_data', text => text.textContent.split('г.')[0]);
            
			dataObj['imageUrl'] = await newPage.$$eval('.block_news_detail_gallery_b a', img => {
                img = img.map(el => el.href)
                return img;
            });	

            dataObj['imageUrl'].push(await newPage.$eval('.block_news_detail_t_img img', img => img = img.src));

			dataObj['newsDesc'] = await newPage.$$eval('.block_news_detail_t_t p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim())
				return div;
			});

			if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.block_news_detail_t_t', div => [ div.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim()])
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_khakas_mno').then((res) =>{
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
			createTable(scrapedData, 'news_khakas_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 