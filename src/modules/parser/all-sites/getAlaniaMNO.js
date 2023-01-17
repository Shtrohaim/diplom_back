import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';
import changeNumMonth from '../constant/changeNumMonth.js';


const scraperObject = {
    url: 'http://mon.alania.gov.ru/news',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.news__list');
		// Get the link to all the required books
		let urls = await page.$$eval('.news__list .views-row', links => {
			links = links.map(el => el.querySelector('.post__image').href)
			return links;
		});


		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
                waitUntil: 'load',
                timeout: 0
            });
			dataObj['newsTittle'] = await newPage.$eval('.page__title h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			
			dataObj['newsDate'] = await newPage.$eval('.news__single__more .time time', text => text.textContent.split(',')[0]);
            dataObj['newsDate'] = changeNumMonth.changeMonth(dataObj['newsDate']);
			
	        dataObj['imageUrl'] = await newPage.$$eval('.fotorama .fotorama__nav-wrap img', img => {
                img = img.map(el => el.src);
                return img
            })

            if(dataObj['imageUrl'].length === 0){
                dataObj['imageUrl'] = await newPage.$$eval('.fotorama .fotorama__stage__frame img', img =>{
                    img = img.map(el=>el.src);
                    return img;
                });
            }

			dataObj['newsDesc'] = await newPage.$$eval('.news__single__content p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim())
				return div;
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.news__single__content', div => [ div.textContent.replace(/((\d\d)\.(\d\d)\.(\d\d\d\d))|(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim() ]);
            }
            
			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();

		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_alania_mno').then((res) =>{
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
			createTable(scrapedData, 'news_alania_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 