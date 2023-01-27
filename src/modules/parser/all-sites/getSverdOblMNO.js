import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const MONTHS = {
    0:'Января',
    1:'Февраля',
    2:'Марта',
    3:'Апреля',
    4:'Майа',
    5:'Июня',
    6:'Июля',
    7:'Августа',
    8:'Сентября',
    9:'Октября',
    10:'Ноября',
    11:'Декабря' }
    
const scraperObject = {
    url: 'https://minobraz.egov66.ru/news/index',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.pubs-list');
		// Get the link to all the required books
		let urls = await page.$$eval('.pubs-list > div', links => {
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

			dataObj['newsTittle'] = await newPage.$eval('.pub h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			
			dataObj['newsDate'] = await newPage.$eval('.pub .date-custom', text => text.textContent);

            if(dataObj['newsDate'] === "Сегодня"){
                let date = new Date(Date.now())
                dataObj['newsDate'] = date.getDate() + " " + MONTHS[date.getMonth()] + " " + date.getFullYear();
            } else if(dataObj['newsDate'] === "Вчера"){
                let date = new Date(Date.now() - 86400000)
                dataObj['newsDate'] = date.getDate() + " " + MONTHS[date.getMonth()] + " " + date.getFullYear();
            }else{
                dataObj['newsDate'] = dataObj['newsDate'] + " " + new Date().getFullYear();
            }

            dataObj['imageUrl'] = await newPage.$$eval('.pub-body .images-gallery .image-item img', img => {
                img = img.map(el => el.src);
                return img
            });
         
			dataObj['newsDesc'] = await newPage.$$eval('.pub-body .body > p, .body li', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim());
				return div;  
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.pub-body .body', div => [ div.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim() ]);
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_sverdobl_mno').then((res) =>{
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
			createTable(scrapedData, 'news_sverdobl_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 