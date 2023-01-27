const MONTHS = {
    '01':'Января',
    '02':'Февраля',
    '03':'Марта',
    '04':'Апреля',
    '05':'Мая',
    '06':'Июня',
    '07':'Июля',
    '08':'Августа',
    '09':'Сентября',
    '10':'Октября',
    '11':'Ноября',
    '12':'Декабря' }

function changeMonth(date){

    let dateSplit = date.split('.');

    let newDate = dateSplit[0] + " " + MONTHS[dateSplit[1]] + " " + dateSplit[2];

    return newDate

}

export default { changeMonth };