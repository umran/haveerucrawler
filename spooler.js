var config = require('./config.js');
var async = require('async');
var read = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var record = require('./models/url');
var redisConfig = config.redis;
var redis = require('redis');
var client = redis.createClient(redisConfig.port, redisConfig.host);

//connect to mongodb
mongoose.connect(config.mongoServer);

var prefix = 'http://haveeru.com.mv';
var checkstring = new RegExp('(http:\/\/haveeru\.com\.mv|http:\/\/www\.haveeru\.com\.mv)');
var queries = [];
var jobUrl = process.argv[2].toString();

read(jobUrl, function(error, response, body){

	if(error){
		mongoose.disconnect();
		client.quit();
		return;
	}
	if(response.statusCode !== 200){
		mongoose.disconnect();
		client.quit();
		return;
	}
	
	//load body into DOM
	var $ = cheerio.load(body, {normalizeWhitespace: true, xmlMode: true});
	
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
	
	//execute all io calls in parallel and quit script once all operations have called back
	async.parallel(queries, function(err,res){
		if(err){
			process.stderr.write(err);
		}
		mongoose.disconnect();
		client.quit();
	});
});