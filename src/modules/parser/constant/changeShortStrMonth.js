const MONTHS = {
    'янв':'Января',
    'фев':'Февраля',
    'мар':'Марта',
    'апр':'Апреля',
    'май':'Майа',
    'июн':'Июня',
    'июл':'Июля',
    'авг':'Августа',
    'сен':'Сентября',
    'окт':'Октября',
    'ноя':'Ноября',
    'дек':'Декабря' }

function changeMonth(date){

    let dateSplit = date.split(' ');

    let newDate = dateSplit[0] + " " + MONTHS[dateSplit[1]] + " " + dateSplit[2];

    return newDate

}

export default { changeMonth };                                                     