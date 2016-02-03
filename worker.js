var config = require('./config.js');
var async = require('async');
var read = require('request');
var cheerio = require('cheerio');
var crypto = require('crypto');
var mongoose = require('mongoose');
var document = require('./models/doc');
var record = require('./models/url');
var redisConfig = config.redis;
var redis = require('redis');
var client = redis.createClient(redisConfig.port, redisConfig.host);

var Utils = require('./modules/utils.js');
var utils = new Utils;

//connect to mongodb
mongoose.connect(config.mongoServer);

var prefix = 'http://haveeru.com.mv';
var checkstring = new RegExp('(http:\/\/haveeru\.com\.mv|http:\/\/www\.haveeru\.com\.mv)');
var jobUrl = process.argv[2].toString();
var queries = [];
var deferred = [];
var state;

var delimiters = /comments|service\-holder|ad\-holder|related\-articles/gi
  , delimiter = null
  , $
  , raw
  , tMax
  , doc = {};

//define function to commit state to redis
function commitState(state){
	deferred.push(function(callback){
		if(state === 'retry'){
			client.get(jobUrl, function(err, res){
				if(err){
					callback(new Error('Redis Error: An error occurred during get operation'));
					return;
				}
				if(res === 'retry'){
					client.set(jobUrl, 'done', function(err){
						if(err){
							callback(new Error('Redis Error: An error occurred during set operation'));
							return;
						}
						callback();
					});
					return;
				}
				client.set(jobUrl, state, function(err){
					if(err){
						callback(new Error('Redis Error: An error occurred during set operation'));
						return;
					}
					callback();
				});
			});
			return;
		}
		
		client.set(jobUrl, state, function(err){
			if(err){
				callback(new Error('Redis Error: An error occurred during set operation'));
				return;
			}
			callback();
		});
	});
}

//tell db that link has been checked at least once
deferred.push(function(callback){
	var newRec = new record({url:jobUrl});
	newRec.save(function (err) {
		if (err){
			if(err.code !== 11000){
				callback(new Error('Mongo Error: An error occurred during save operation'));
				return;
			}
			callback();
			return;
		}
		callback();
	});
});


//download url
read(jobUrl, function(error, response, body){
	if(error){
		//this error is handled directly in the callback function
		state = 'retry';
		
		//assert state
		commitState(state);
		
		
		//execute all io calls in parallel and quit script once all operations have called back
		async.parallel(queries, function(err){
			if(err){
				console.error(err);
				mongoose.disconnect();
				client.quit();
				return;
			}
			
			//finish up deferred queries
			async.parallel(deferred, function(err){
				if(err){
					console.error(err);
				}
				mongoose.disconnect();
				client.quit();
			});
		});
		
		return;
	}
	if(response.statusCode !== 200){
		state = 'retry';
		
		//assert state
		commitState(state);
		
		
		//execute all io calls in parallel and quit script once all operations have called back
		async.parallel(queries, function(err){
			if(err){
				console.error(err);
				mongoose.disconnect();
				client.quit();
				return;
			}
			
			//finish up deferred queries
			async.parallel(deferred, function(err){
				if(err){
					console.error(err);
				}
				mongoose.disconnect();
				client.quit();
			});
		});
		
		return;
	}
	
	state = 'done';
	
	//assert state
	commitState(state);
	
	//load body into DOM
	$ = cheerio.load(body, {normalizeWhitespace: true, xmlMode: true});

	//extract all links
	$($('a')).each(function(i, link){
		if(!$(link).attr('href')){
			return;
		}
	
		//filter and format link
		if($(link).attr('href').charAt(0) !== '/' && checkstring.test($(link).attr('href')) === false){
			return;
		}
	
		link = $(link).attr('href').toString();
	
		if (link.charAt(0) === '/'){
			link = prefix.concat(link);
		}
	
		//send link to be checked against database
		queries.push(function(callback){
		
			// begin query
			record.count({url:link},function(err,count){
				if(err){
					//500: Mongo Error: An error occurred during count operation
					callback(new Error('Mongo Error: An error occurred during count operation'));
					return;
				}
		
				if(count > 0){
					callback();
					return;
				}
		
				//check if url exists in redis queue
				client.exists(link,function(err,res){
					if(err){
						//500: Redis Error: An error occurred during exists operation
						callback(new Error('Redis Error: An error occurred during exists operation'));
						return;
					}
					if(res === 1){
						callback();				
						return;
					}
			
					//send new url to redis
					client.set(link, 'inq', function(err){
						if(err){
							//500: Redis Error: An error occurred during set operation
							callback(new Error('Redis Error: An error occurred during set operation'));
							return;
						}
						callback();
					});
				});
			});
		});
	});

	//check if document is an article
	if($('.post-frame').length === 0){
		//execute all io calls in parallel and quit script once all operations have called back
		async.parallel(queries, function(err){
			if(err){
				console.error(err);
				mongoose.disconnect();
				client.quit();
				return;
			}
			
			//finish up deferred queries
			async.parallel(deferred, function(err){
				if(err){
					console.error(err);
				}
				mongoose.disconnect();
				client.quit();
			});
		});
		return;
	}

	//sanitize document
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

	//find article delimiter
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

	//create document object
	
	//raw fields
	doc.url = jobUrl;
	doc.title = $('h1', '.post').text();
	doc.byline = $('.subttl', '.post').text();
	doc.r_date = $('.date', '.post').text();
	doc.intro = $('.intro','.post-frame').text();
	
	if(delimiter !== null){
		doc.fulltext = $('.intro','.post-frame').nextUntil(delimiter).text();
		
		//optional html source not 100% accurate
		doc.main = $('.intro','.post-frame').nextUntil(delimiter).html();
	} else {
		doc.fulltext = raw.text();
		
		//optional html source not 100% accurate
		doc.main = raw.html();
	}
	doc.fulltext = doc.fulltext.replace(/\s\s+/g, ' ');
	doc.fulltext = doc.fulltext.replace(/&nbsp;/g,' ');
	
	doc.hash = crypto.createHash('sha256').update(doc.url.concat(doc.title,doc.byline,doc.r_date,doc.intro,doc.main,doc.fulltext)).digest('hex');
	doc.dupfilter = crypto.createHash('sha256').update(doc.title.concat(doc.byline,doc.r_date,doc.intro,doc.main,doc.fulltext)).digest('hex');
	
	//derived fields
	doc.indexed_date = new Date().toISOString();
	if(utils.convertDate(doc.r_date) !== false){
		doc.date = utils.convertDate(doc.r_date);
	} else{
		doc.date = null;
	}
	
	//send document to be saved on disk
	queries.push(function(callback){
		var newDoc = new document({url:doc.url, r_title:doc.title, r_byline:doc.byline, r_date:doc.r_date, date:doc.date, indexed_date:doc.indexed_date, r_intro:doc.intro, r_main:doc.main, fulltext:doc.fulltext, hash:doc.hash, dup_filter:doc.dupfilter});
		newDoc.save(function (err){
			if (err){
				if(err.code !== 11000){
					// 600: Mongo Error: An error occurred during save operation
					callback(new Error('Mongo Error: An error occurred during save operation'));
					return;
				}
				callback();
				return;
			}
			newDoc.on('es-indexed', function(err){
				if(err){
					callback(700);
					return;
				}
				process.stdout.write(doc.hash);
				callback();
			});
		});
	});
	
	//execute all io calls in parallel and quit script once all operations have called back
	async.parallel(queries, function(err){
		if(err){
			//special case
			if(err === 700){
				console.error(new Error('Elasticsearch Error: An error occurred during the indexing operation'));
					
				//gracefully shutdown I/O and manually kill the process
				mongoose.disconnect();
				client.quit();
				process.exit();
				
				return;
			}

			console.error(err);

			mongoose.disconnect();
			client.quit();
			return;
		}
		
		//finish up deferred queries
		async.parallel(deferred, function(err){
			if(err){
				console.error(err);
			}
			
			mongoose.disconnect();
			client.quit();
		});
	});
});