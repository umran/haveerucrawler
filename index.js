var config = require('./config.js');
var socket = require('socket.io-client');
var io = socket.connect(config.ioServer);
var client = require('./modules/shared/redisClient.js');
var conveyor = require('./modules/conveyor.js');
var belt = new conveyor('./worker.js', './seeder.js', 2);
var scanner = require('./modules/scanner.js');
var scan = new scanner();

//communicate upstate to front-end
io.on('connect', function(){
	io.emit('status', 1);
});

belt.process([{url:'http://www.haveeru.com.mv/', seed:true},{url:'http://www.haveeru.com.mv/dhivehi/', seed:true}], relay);

belt.queue.drain = function(){
	console.log('current batch done');
	scan.fetch(function(err, res){
		if(err){
			console.log(err);
			client.quit();
			io.close();
			return;
		}
		if(res.length > 0){
			console.log('new batch queued: '+res.length.toString());
			belt.process(res, relay);
			return;
		}
		io.emit('status', 0);
		//sit idle for 5 minutes until the next try
		setTimeout(function(){
			client.quit();
			io.close();
		},300000);
		
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
	if(stderr){
		io.emit('exception', stderr);
	}
	if(stdout){
		io.emit('update', stdout);
	}
}