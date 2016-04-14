var config = require('../config.js');
var async = require('async');
var read = require('request');
var cheerio = require('cheerio');
var record = require('../models/url');

//modularize

function unleak(s)
{
    return (' ' + s).substr(1);
}

function Seeder(redis_client){
	this.client = redis_client;
	this.prefix = 'http://haveeru.com.mv';
	this.checkstring = new RegExp('(http:\/\/haveeru\.com\.mv|http:\/\/www\.haveeru\.com\.mv)');
	this.queries = [];
	this.$;
}

Seeder.prototype.seed = function(jobUrl, callback){

	var self = this;

	read(jobUrl, function(error, response, body){

		if(error){
			callback(error);
			return;
		}
		if(response.statusCode !== 200){
			callback(new Error('HTTP Response !200'));
			return;
		}
	
		//load body into DOM
		self.$ = cheerio.load(body, {normalizeWhitespace: true, xmlMode: true});
	
		//extract all links
		self.$(self.$('a')).each(function(i, link){
			if(!self.$(link).attr('href')){
				return;
			}
	
			//filter and format link
			if(self.$(link).attr('href').charAt(0) !== '/' && self.checkstring.test(self.$(link).attr('href')) === false){
				return;
			}
	
			link = unleak(self.$(link).attr('href').toString());
	
			if (link.charAt(0) === '/'){
				link = self.prefix.concat(link);
			}
	
			//send link to be checked against database
			self.queries.push(function(callback){
		
				// begin query
				record.count({url:link},function(err,count){
					if(err){
						callback(new Error('Mongo Error: An error occurred during count operation'));
						return;
					}
		
					if(count > 0){
						callback();
						return;
					}
		
					//check if url exists in redis queue
					self.client.exists(link,function(err,res){
						if(err){
							callback(new Error('Redis Error: An error occurred during exists operation'));
							return;
						}
						if(res === 1){
							callback();				
							return;
						}
			
						//send new url to redis
						self.client.set(link, 'inq',function(err){
							if(err){
								callback(new Error('Redis Error: An error occurred during set operation'));
								return;
							}
							callback();
						});
					});
				});
			});
		});
	
		//execute all io calls in parallel and quit script once all operations have called back
		async.parallel(self.queries, function(err){
			if(err){
				callback(err);
				return;
			}
			callback();
		});
	});
}

module.exports = Seeder;