import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const MONTHS = {
    '01':'Января',
    '02':'Февраля',
    '03':'Марта',
    '04':'Апреля',
    '05':'Майа',
    '06':'Июня',
    '07':'Июля',
    '08':'Августа',
    '09':'Сентября',
    '10':'Октября',
    '11':'Ноября',
    '12':'Декабря' }

const scraperObject = {
    url: 'http://www.educaltai.ru/news/',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('#content .center_col .news_list');
		// Get the link to all the required books
		let urls = await page.$$eval('#content .center_col .news_list .news_item', links => {
			links = links.map(el => el.querySelector('.name').href)
			return links;
		});


		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});

			dataObj['newsTittle'] = await newPage.$eval('.title_page h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			dataObj['newsDate'] = await newPage.$eval('.news-detail .news-date-time', text => text.textContent);

            let dateSplit = dataObj['newsDate'].split('.');

            dataObj['newsDate'] = dateSplit[0] + " " + MONTHS[dateSplit[1]] + " " + dateSplit[2];

	        dataObj['imageUrl'] = await newPage.$$eval('.news-detail img', img => {
                img = img.map(el => el.src);
                return img
            });

			dataObj['newsDesc'] = await newPage.$$eval('.news-detail > p, .news-detail > div', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim());
				return div;
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.news-detail', div => [ div.textContent ] );
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_altkray_mno').then((res) =>{
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
			createTable(scrapedData, 'news_altkray_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 