var config = require('./config.js');
var socket = require('socket.io-client');
var io = socket.connect(config.ioServer);
var client = require('./modules/shared/redisClient.js');
var conveyor = require('./modules/conveyor.js');
var belt = new conveyor('./worker.js', './seeder.js', 2);
var scanner = require('./modules/scanner.js');
var scan = new scanner();
var events = require('events');
var eventEmitter = new events.EventEmitter();

//signal active-state to front-end
io.on('connect', function(){
	io.emit('status', 1);
});

belt.process([{url:'http://www.haveeru.com.mv/', seed:true},{url:'http://www.haveeru.com.mv/dhivehi/', seed:true}], relay);

belt.queue.drain = function(){
	console.log('current batch done');
	scan.fetch(function(err, res){
		if(err){
			console.error(err);
			client.quit();
			io.close();
			return;
		}
		if(res.length > 0){
			console.log('new batch queued: '+res.length.toString());
			belt.process(res, relay);
			return;
		}
		
		//signal idle-state to front-end and sit idle for 5 minutes until the next try
		io.emit('status', 0);
		console.log('no more jobs remaining: application will quit in 5 minutes');
		setTimeout(function(){
			client.quit();
			io.close();
		},300000);
	});
}

eventEmitter.once('die', function(){
	belt.queue.kill();
	client.quit();
	io.close();
});

function relay(err, stderr, stdout){
	if(err){
		//errors emitted by exec may be ignored if they meet the below conditions, i.e if the child process simply timed out
		if(err.killed === true && err.code === null && err.signal === 'SIGTERM'){
			console.log('worker process timed out');
			return;	
		}
		console.error(err);
		eventEmitter.emit('die');
		return;
	}
	if(stderr){
		console.error(stderr);
		eventEmitter.emit('die');
		return;
	}
	if(stdout){
		io.emit('update', stdout);
	}
}