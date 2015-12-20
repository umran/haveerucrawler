var read = require('request');
var cheerio = require('cheerio');
var job1 = 'http://www.haveeru.com.mv/news/43142';
var job2 = 'http://www.haveeru.com.mv/news/59215';
var job3 = 'http://www.haveeru.com.mv/news/64901';
var job4 = 'http://www.haveeru.com.mv/bml/64518';
var job5 = 'http://haveeru.com.mv/dhivehi/sports/118205';
var job6 = 'http://www.haveeru.com.mv/dhivehi/business/182006';

$ = cheerio.load("<div class='article'><p class='intro'></p><div class='p1 hiccup  raikonen'><span>dorem ipsor lotet asdf asdf ajfg sdk a sdfdf k asdfdk dsfsdf</span></div><div class='p2'><span>extasi moli ryfr croc krac stuff like that</span></div><div class='terminate'></div></div>", {normalizeWhitespace: true, xmlMode: true});

$('div', '.article').before(' ');
$('div', '.article').after(' ');

//console.log($.html());

//var max = $('.intro', '.article').nextAll().text();
var main = $('.intro', '.article').nextUntil('.terminate').text();
//var main = $('.intro', '.article').nextAll();

console.log(main);

