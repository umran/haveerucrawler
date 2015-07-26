var client = require('./modules/shared/redisClient.js');
var conveyor = require('./modules/conveyor.js');
var belt = new conveyor('./worker.js', './spooler.js', 8);
var scanner = require('./modules/scanner.js');
var scan = new scanner();

belt.process([{url:'http://www.haveeru.com.mv/', seed:true},{url:'http://www.haveeru.com.mv/dhivehi/', seed:true}], relay);

belt.queue.drain = function(){
	console.log('current batch done');
	scan.fetch(function(err, res){
		if(err){
			console.log(err);
			client.quit();
			return;
		}
		if(res.length > 0){
			console.log('new batch queued: '+res.length.toString());
			belt.process(res, relay);
			return;
		}
		console.log('no more jobs, quitting...');
		client.quit();
	});
}

function relay(err, stderr, stdout){
	if(err){
		if(err.code === null){
			return;
		}
		console.error(err);
		return;
	}
	if(stdout){
		console.log('stdout: ' + stdout);
	}
	if(stderr){
		console.log('stderr: ' + stderr);
	}
}