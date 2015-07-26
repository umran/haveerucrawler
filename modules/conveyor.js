var async = require('async');
var exec = require('child_process').exec;

module.exports = function(worker, seeder, concurrency) {
	var worker = worker;
	var seeder = seeder;
	if (typeof concurrency === 'undefined'){
		var concurrency = 1;
	}
	var concurrency = concurrency;
	
	this.queue = async.queue(function (url, callback) {
		
		//default worker
		var cp = worker;
		
		if(url.seed === true){
			cp = seeder;
			url = url.url;
		}
		
		var args = "node "+ cp +" '"+ url +"'";
    
    exec(args, {timeout: 300000}, function(err, stdout, stderr){
			if(err){
				callback(err);
				return;
			}
			
			callback(null, stderr, stdout);
		});
	}, concurrency);
	
	this.process = function(url, callback){
		this.queue.push(url, function(err, stderr, stdout){
			if(err){
				callback(err);
				return;
			}
			callback(null, stderr, stdout);
		});
	}
}