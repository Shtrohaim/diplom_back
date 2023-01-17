import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';
import changeNumMonth from '../constant/changeNumMonth.js';

const scraperObject = {
    url: 'https://monrt.rtyva.ru/index.php/ru/novosti',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.blog');
		// Get the link to all the required books
		let urls = await page.$$eval('.blog .items-leading, .blog .items-row', links => {
			links = links.map(el => el.querySelector('.comments-link').href)
			return links;
		});


		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});

			dataObj['newsTittle'] = await newPage.$eval('.art-post .art-postheader', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			
			dataObj['newsDate'] = await newPage.$eval('.art-post .art-postdateicon', text => text.textContent.split(' ')[1]);
            dataObj['newsDate'] = changeNumMonth.changeMonth(dataObj['newsDate']);

	        dataObj['imageUrl'] = await newPage.$$eval('.art-article p:nth-child(2) img', img => {
                img = img.map(el => el.src);
                return img
            });

			dataObj['newsDesc'] = await newPage.$$eval('.art-article p', div => {
				div = div.map(el => {
                    if(el.querySelector('script') === null){
                        el = el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim()
                    }else{
                        el = ""
                    }
                    return el;
                });
				return div;
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.art-article', div => [ div.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim()])
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_tuva_mno').then((res) =>{
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
			createTable(scrapedData, 'news_tuva_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 