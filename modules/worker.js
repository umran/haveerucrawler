var config = require('../config.js');
var async = require('async');
var read = require('request');
var cheerio = require('cheerio');
var crypto = require('crypto');
var document = require('../models/doc');
var record = require('../models/url');

var Utils = require('./utils.js');
var utils = new Utils;

//modularize

function unleak(s)
{
    return (' ' + s).substr(1);
}

function Worker(redis_client){
	this.client = redis_client;
	this.prefix = 'http://haveeru.com.mv';
	this.checkstring = new RegExp('(http:\/\/haveeru\.com\.mv|http:\/\/www\.haveeru\.com\.mv)');
	this.queries = [];
	this.deferred = [];
	this.state;
	this.$;

	this.delimiters = /comments|service\-holder|ad\-holder|related\-articles/gi;
	this.delimiter = null;
	this.raw;
	this.tMax;
	this.doc = {};
}

Worker.prototype.work = function(jobUrl, callback){

	var self = this;

	//define function to commit state to redis
	function commitState(state){
		self.deferred.push(function(callback){
			if(state === 'retry'){
				self.client.get(jobUrl, function(err, res){
					if(err){
						callback(new Error('Redis Error: An error occurred during get operation'));
						return;
					}
					if(res === 'retry'){
						self.client.set(jobUrl, 'done', function(err){
							if(err){
								callback(new Error('Redis Error: An error occurred during set operation'));
								return;
							}
							callback();
						});
						return;
					}
					self.client.set(jobUrl, state, function(err){
						if(err){
							callback(new Error('Redis Error: An error occurred during set operation'));
							return;
						}
						callback();
					});
				});
				return;
			}
		
			self.client.set(jobUrl, state, function(err){
				if(err){
					callback(new Error('Redis Error: An error occurred during set operation'));
					return;
				}
				callback();
			});
		});
	}

	//tell db that link has been checked at least once
	self.deferred.push(function(callback){
		var newRec = new record({url:jobUrl});
		newRec.save(function (err) {
			if (err){
				if(err.code !== 11000){
					callback(new Error('Mongo Error: An error occurred during save operation ' + err));
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
			//self error is handled directly in the callback function
			self.state = 'retry';
		
			//assert state
			commitState(self.state);
		
		
			//execute all io calls in parallel and quit script once all operations have called back
			async.parallel(self.queries, function(err){
				if(err){
					callback(err);
					return;
				}
			
				//finish up deferred queries
				async.parallel(self.deferred, function(err){
					if(err){
						callback(err);
						return;
					}
					callback();
				});
			});
		
			return;
		}
		if(response.statusCode !== 200){
			self.state = 'retry';
		
			//assert state
			commitState(self.state);
		
		
			//execute all io calls in parallel and quit script once all operations have called back
			async.parallel(self.queries, function(err){
				if(err){
					callback(err);
					return;
				}
			
				//finish up deferred queries
				async.parallel(self.deferred, function(err){
					if(err){
						callback(err);
						return;
					}
					callback();
				});
			});
		
			return;
		}
	
		self.state = 'done';
	
		//assert state
		commitState(self.state);
	
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
	
			link = unleak(self.$(link).attr('href')).toString();
	
			if (link.charAt(0) === '/'){
				link = self.prefix.concat(link);
			}
	
			//send link to be checked against database
			self.queries.push(function(callback){
		
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
					self.client.exists(link,function(err,res){
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
						self.client.set(link, 'inq', function(err){
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
		if(self.$('.post-frame').length === 0){
			//execute all io calls in parallel and quit script once all operations have called back
			async.parallel(self.queries, function(err){
				if(err){
					callback(err);
					return;
				}
			
				//finish up deferred queries
				async.parallel(self.deferred, function(err){
					if(err){
						callback(err);
						return;
					}
					callback();
				});
			});
			return;
		}

		//sanitize document
		self.$('script', '.post-frame').remove();
		self.$('style', '.post-frame').remove();
		self.$('br', '.post-frame').before(' ');
		self.$('br', '.post-frame').after(' ');
		self.$('p', '.post-frame').before(' ');
		self.$('p', '.post-frame').after(' ');
		self.$('div', '.post-frame').before(' ');
		self.$('div', '.post-frame').after(' ');
		self.$('span', '.post-frame').before(' ');
		self.$('span', '.post-frame').after(' ');

		//find article delimiter
		self.raw = self.$('.intro','.post-frame').nextAll();
	
		self.tMax = self.raw.length;
		for(i=0; i<self.tMax; i++){
			var sibling = self.raw[i];
		
			if (typeof sibling.attribs.class === "undefined"){
				continue;
			}
		
			var candidates = sibling.attribs.class.match(self.delimiters);
			if (candidates !== null){
				self.delimiter = "."+candidates[0];
				break;	
			}
		}

		//create document object
		//raw fields
		self.doc.url = jobUrl;
		self.doc.title = unleak(self.$('h1', '.post').text());
		self.doc.byline = unleak(self.$('.subttl', '.post').text());
		self.doc.r_date = unleak(self.$('.date', '.post').text());
		self.doc.intro = unleak(self.$('.intro','.post-frame').text());
		
		if(self.delimiter !== null){
			self.doc.fulltext = unleak(self.$('.intro','.post-frame').nextUntil(self.delimiter).text());
		
			//optional html source not 100% accurate
			self.doc.main = unleak(self.$('.intro','.post-frame').nextUntil(self.delimiter).html());
		} else {
			self.doc.fulltext = unleak(self.raw.text());
		
			//optional html source not 100% accurate
			self.doc.main = unleak(self.raw.html());
		}
		self.doc.fulltext = self.doc.fulltext.replace(/\s\s+/g, ' ');
		self.doc.fulltext = self.doc.fulltext.replace(/&nbsp;/g,' ');
	
		self.doc.hash = crypto.createHash('sha256').update(self.doc.url.concat(self.doc.title,self.doc.byline,self.doc.r_date,self.doc.intro,self.doc.main,self.doc.fulltext)).digest('hex');
		self.doc.dupfilter = crypto.createHash('sha256').update(self.doc.title.concat(self.doc.byline,self.doc.r_date,self.doc.intro,self.doc.main,self.doc.fulltext)).digest('hex');
	
		//derived fields
		self.doc.indexed_date = new Date().toISOString();
		if(utils.convertDate(self.doc.r_date) !== false){
			self.doc.date = utils.convertDate(self.doc.r_date);
		} else{
			self.doc.date = null;
		}
	
		//send document to be saved on disk
		self.queries.push(function(callback){
			var newDoc = new document({url:self.doc.url, r_title:self.doc.title, r_byline:self.doc.byline, r_date:self.doc.r_date, date:self.doc.date, indexed_date:self.doc.indexed_date, r_intro:self.doc.intro, r_main:self.doc.main, fulltext:self.doc.fulltext, hash:self.doc.hash, dup_filter:self.doc.dupfilter});
			newDoc.save(function (err){
				if (err){
					if(err.code !== 11000){
						callback(new Error('Mongo Error: An error occurred during save operation, '+ err));
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
					callback();
				});
			});
		});
	
		//execute all io calls in parallel and quit script once all operations have called back
		async.parallel(self.queries, function(err){
		
			if(err){
				//special case
				if(err === 700){
					callback(new Error('Elasticsearch Error: An error occurred during the indexing operation'));
				
					return;
				}

				callback(err);
				return;
			}
		
			//finish up deferred queries
			async.parallel(self.deferred, function(err){
				if(err){
					callback(err);
					return;
				}
			
				callback();
			});
		});
	});
}

module.exports = Worker;