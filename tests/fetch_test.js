var read = require('request');
var cheerio = require('cheerio');
var job1 = 'http://www.haveeru.com.mv/news/43142';
var job2 = 'http://www.haveeru.com.mv/news/59215';
var job3 = 'http://www.haveeru.com.mv/news/64901';
var job4 = 'http://www.haveeru.com.mv/bml/64518';
var job5 = 'http://haveeru.com.mv/dhivehi/sports/118205';
var job6 = 'http://www.haveeru.com.mv/dhivehi/business/182006';

var delimiters = /comments|service\-holder|ad\-holder|related\-articles/gi
  , delimitter = null
  , $
  , raw
  , tMax
  , output;

//download url
read(job3, function(error, response, body){
	if(error){
		return;
	}
	if(response.statusCode !== 200){
		return;
	}

	//load body into DOM
	$ = cheerio.load(body, {normalizeWhitespace: true, xmlMode: true});
	$('script', '.post-frame').remove();
	$('style', '.post-frame').remove();
	$('br', '.post-frame').before(' ');
	$('br', '.post-frame').after(' ');
	$('p', '.post-frame').before(' ');
	$('p', '.post-frame').after(' ');
	$('div', '.post-frame').before(' ');
	$('div', '.post-frame').after(' ');
	$('span', '.post-frame').before(' ');
	$('span', '.post-frame').after(' ');
	
	raw = $('.intro','.post-frame').nextAll();
	
	tMax = raw.length;
	for(i=0; i<tMax; i++){
		var sibling = raw[i];
		
		if (typeof sibling.attribs.class === "undefined"){
		    continue;
		}
		
		var candidates = sibling.attribs.class.match(delimiters);
		if (candidates !== null){
			delimiter = "."+candidates[0];
			break;	
		}
	}
	
	//console.log(delimiter);
	
	if(delimiter !== null){
		output = $('.intro','.post-frame').nextUntil(delimiter).text();
	} else {
		output = raw.text();
	}
	output = output.replace(/\s\s+/g, ' ');
	output = output.replace(/&nbsp;/g,' ');
	
	console.log(output);
});