var config = require('../config.js');
var mongoose = require('mongoose');
var async = require('async');
var Seeder = require('../modules/seeder');
var Worker = require('../modules/worker');

//connect to mongodb
mongoose.connect(config.mongoServer);

//test
var url = 'http://www.haveeru.com.mv/news/67114?e=en_mid';

var q = async.queue(function (job, callback) {
	var worker = new Worker();

	worker.work(job, function(err){
		if(err){
			callback(err);
			return;
		}
		callback(null, 'job done');
	});

}, 1);

q.drain = function(){
	q.push(url, function(err, msg){
		if(err){
			console.log(err);
			return;
		}
		console.log(msg);
	});
}

q.push(url, function(err, msg){
	if(err){
		console.log(err);
		return;
	}
	console.log(msg);
});