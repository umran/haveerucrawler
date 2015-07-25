var async = require('async');
var exec = require('child_process').exec;

module.exports = function(cpPath, concurrency) {
	var cpPath = cpPath;
	if (typeof concurrency === 'undefined'){
		var concurrency = 1;
	}
	var concurrency = concurrency;
	
	this.queue = async.queue(function (url, callback) {
    var args = "node "+ cpPath +" '"+ url +"'";
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