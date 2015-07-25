var async = require('async');
var redis = require('redis');
var client = redis.createClient();

var calls = [];
var done = 0;
var inq = 0;
var total;
var progress;

function nextBatch(err,res){
	if(err){
		console.log('unexpected redis error occurred');
		return;
	}
	var cursor = res[0];
	var batch = res[1];
	
	if(batch.length > 0){
		//put redis operations in a parallel queue
		batch.forEach(function(url){
			calls.push(function(callback){
				client.get(url, function(err,res){
					if(err){
						callback(null, 'unexpected redis error occurred');
						return;
					}
					if(res === 'done'){
						done += 1;
						callback();
						return;
					}
					inq += 1;
					callback();
				});
			});
		});
	}
	
	if(cursor == 0){
		//execute redis operations and do stuff when all operations have called back
		async.parallel(calls, function(err, result) {
    	if(err){
    		console.log('an unexpected error occurred in processing the new batch, quitting...');
    		client.quit();
    		return;
    	}
			
			total = done+inq;
			progress = (done/total)*100;
		
			console.log(done+' out of '+total+' urls were checked');
			console.log(progress+'% done');
			client.quit();
			
		});
		return;
	}
	client.scan(cursor,nextBatch);
}
console.log('fetching data');
client.scan(0,nextBatch);