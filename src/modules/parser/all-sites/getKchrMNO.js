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
    url: 'https://minobrkchr.ru/',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.MiniBlocksInfo');
		// Get the link to all the required books
		let urls = await page.$$eval('.ListMiniBlock .ItemMiniBlock', links => {
			links = links.map(el => el.querySelector('td .Name').href)
			return links;
		});


		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
                waitUntil: 'load',
                timeout: 0
            });
			dataObj['newsTittle'] = await newPage.$eval('.TitH2 h2', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			dataObj['newsDate'] = await newPage.$eval('.DateMn .NumberDay', text => text.textContent);

            let dateSplit = dataObj['newsDate'].split('.');

            dataObj['newsDate'] = dateSplit[0] + " " + MONTHS[dateSplit[1]] + " " + dateSplit[2];


	        dataObj['imageUrl'] = await newPage.$$eval('.RightBlockDetailNews .sliderkit-panels .sliderkit-panel img', img => {
                img = img.map(el => el.src);
                return img
            });

            if(dataObj['imageUrl'].length === 0){
                dataObj['imageUrl'] = await newPage.$eval('.RightBlockDetailNews > .colorbox_img img', img => [ img.src ]);
            }

			dataObj['newsDesc'] = await newPage.$$eval('.LeftBlockDetailNews .TextBl p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim())
				return div;
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.LeftBlockDetailNews .TextBl', div => [ div.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim()])
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_kchr_mno').then((res) =>{
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
			createTable(scrapedData, 'news_kchr_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 