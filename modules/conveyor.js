var config = require('../config.js');
var async = require('async');
var Seeder = require('./seeder');
var Worker = require('./worker');

function Conveyor(redis_client) {
	
	this.queue = async.queue(function (url, callback) {
		
		if(url.seed === true){
		
			var seeder = new Seeder(redis_client);
		
			seeder.seed(url.url, function(err){
				if(err){
					callback(err);
					return;
				}
				callback(null, url.url);
			});
			
			return;
		}
    
    		var worker = new Worker(redis_client);

		worker.work(url, function(err){
			if(err){
				callback(err);
				return;
			}
			callback(null, url);
		});

	}, config.concurrency);
}

Conveyor.prototype.process = function(url, callback){
	this.queue.push(url, function(err, msg){
		if(err){
			callback(err);
			return;
		}
		callback(null, msg);
	});
}

module.exports = Conveyor;