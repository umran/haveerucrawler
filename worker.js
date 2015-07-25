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

//connect to mongodb
mongoose.connect(config.mongoServer);

var prefix = 'http://haveeru.com.mv';
var checkstring = new RegExp('(http:\/\/haveeru\.com\.mv|http:\/\/www\.haveeru\.com\.mv)');
var until;
var jobUrl = process.argv[2].toString();
var queries = [];
var state = 'done';

//define function to commit state to redis
function commitState(state){
	queries.push(function(callback){
		if(state === 'retry'){
			client.get(jobUrl, function(err, res){
				if(err){
					callback(err);
					return;
				}
				if(res === 'retry'){
					client.set(jobUrl, 'done', function(err){
						if(err){
							callback(err);
							return;
						}
						callback();
					});
					return;
				}
				client.set(jobUrl, state, function(err){
					if(err){
						callback(err);
						return;
					}
					callback();
				});
			});
			return;
		}
		
		client.set(jobUrl, state, function(err){
			if(err){
				callback(err);
				return;
			}
			callback();
		});
	});
}

//tell db that link has been checked at least once
if(jobUrl !== 'http://haveeru.com.mv/' && jobUrl !== 'http://haveeru.com.mv/dhivehi/'){
	queries.push(function(callback){
		var newRec = new record({url:jobUrl});
		newRec.save(function (err) {
			if (err){
				if(err.code !== 11000){
					callback(err);
					return;
				}
				callback();
				return;
			}
			callback();
		});
	});
}

//download url
read(jobUrl, function(error, response, body){
	if(error){
		process.stderr.write(error);
		state = 'retry';
		
		//assert state
		if(jobUrl !== 'http://haveeru.com.mv/' && jobUrl !== 'http://haveeru.com.mv/dhivehi/'){
			commitState(state);
		}
		
		//execute all io calls in parallel and quit script once all operations have called back
		async.parallel(queries, function(err,res){
			if(err){
				process.stderr.write(err);
			}
			mongoose.disconnect();
			client.quit();
		});
		
		return;
	}
	if(response.statusCode !== 200){
		process.stderr.write('server returned !200 for resource');
		state = 'retry';
		
		//assert state
		if(jobUrl !== 'http://haveeru.com.mv/' && jobUrl !== 'http://haveeru.com.mv/dhivehi/'){
			commitState(state);
		}
		
		//execute all io calls in parallel and quit script once all operations have called back
		async.parallel(queries, function(err,res){
			if(err){
				process.stderr.write(err);
			}
			mongoose.disconnect();
			client.quit();
		});
		
		return;
	}
	
	//assert state
	if(jobUrl !== 'http://haveeru.com.mv/' && jobUrl !== 'http://haveeru.com.mv/dhivehi/'){
		commitState(state);
	}
	//load body into DOM
	var $ = cheerio.load(body, {normalizeWhitespace: true, xmlMode: true});

	//extract all links
	$($('a')).each(function(i, link){
		if(!$(link).attr('href')){
			return;
		}
	
		//once again ignore the seeds
		if($(link).attr('href') === 'http://www.haveeru.com.mv/' || $(link).attr('href') === 'http://www.haveeru.com.mv/dhivehi/' || $(link).attr('href') === 'http://www.haveeru.com.mv' || $(link).attr('href') === 'http://www.haveeru.com.mv/dhivehi'){
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
					callback(err);
					return;
				}
		
				if(count > 0){
					callback();
					return;
				}
		
				//check if url exists in redis queue
				client.exists(link,function(err,res){
					if(err){
						callback(err);
						return;
					}
					if(res === 1){
						callback();				
						return;
					}
			
					//send new url to redis
					client.set(link, 'inq',function(err){
						if(err){
							callback(err);
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
		async.parallel(queries, function(err,res){
			if(err){
				process.stderr.write(err);
			}
			mongoose.disconnect();
			client.quit();
		});
		return;
	}

	//find article delimitter
	if($('.post-frame').find($('.related-articles')).length === 0){
		if($('.post-frame').find($('.service-holder')).length === 0){
			if($('.post-frame').find($('.comments')).length === 0){
				//execute all io calls in parallel and quit script once all operations have called back
				async.parallel(queries, function(err,res){
					if(err){
						process.stderr.write(err);
					}
					mongoose.disconnect();
					client.quit();
				});
				return;
			}
			else{
				until = '.comments';
			}
		}
		else{
			until = '.service-holder';
		}
	}
	else{
		until = '.related-articles';
	}

	//create document object
	var doc = {};
	doc.url = jobUrl;
	doc.title = $('h1', '.post').text();
	doc.byline = $('.subttl', '.post').text();
	doc.date = $('.date', '.post').text();
	doc.intro = $('.intro','.post-frame').text();
	doc.main = $('.intro','.post-frame').nextUntil(until).html();
	doc.fulltext = $('.intro','.post-frame').nextUntil(until).text();
	doc.hash = crypto.createHash('sha256').update(doc.url.concat(doc.title,doc.byline,doc.date,doc.intro,doc.main,doc.fulltext)).digest('hex');

	//send document to be saved on disk
	queries.push(function(callback){
		var newDoc = new document({url:doc.url, r_title:doc.title, r_byline:doc.byline, r_date:doc.date, r_intro:doc.intro, r_main:doc.main, fulltext:doc.fulltext, hash:doc.hash});
		newDoc.save(function (err){
			if (err){
				if(err.code !== 11000){
					callback(err);
					return;
				}
				callback();
				return;
			}
			process.stdout.write(doc.hash);
			callback();
		});
	});
	
	//execute all io calls in parallel and quit script once all operations have called back
	async.parallel(queries, function(err,res){
		if(err){
			process.stderr.write(err);
		}
		mongoose.disconnect();
		client.quit();
	});
});