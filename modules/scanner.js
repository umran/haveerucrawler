var async = require('async');
var client = require('./shared/redisClient.js');

module.exports = function(){
	this.fetch = function(callback){
		var calls = [];
		var results = [];
	
		client.scan(0, nextBatch);
	
		function nextBatch(err,res){
			if(err){
				callback(err);
				return;
			}
			var cursor = res[0];
			var batch = res[1];
	
	
			//put redis operations in a parallel queue
			batch.forEach(function(url){
				calls.push(function(callback){
					client.get(url, function(err,res){
						if(err){
							callback(null, 'unexpected redis error occurred');
							return;
						}
						if(res === 'inq'){
							results.push(url);
							callback();
							return;
						}
						client.del(url, function(err,res){
							if(err){
								callback(err);
								return;
							}
							callback();						
						});
					});
				});
			});
	
			if(cursor === '0'){
				async.parallel(calls, function(err, res) {
					if(err){
						callback(err);
						return;
					}
					callback(null, results);
				});
				return;
			}
			client.scan(cursor,nextBatch);
		}
	}
}
