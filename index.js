//actual application
var config = require('./config.js');
var socket = require('socket.io-client');
var io = socket.connect(config.ioServer);
var redisConfig = config.redis;
var redis = require('redis');
var client = redis.createClient(config.redis.port, config.redis.host);
var mongoose = require('mongoose');
var Conveyor = require('./modules/conveyor.js');
var belt = new Conveyor(client);
var Scanner = require('./modules/scanner.js');
var scan = new Scanner(client);
var events = require('events');
var eventEmitter = new events.EventEmitter();

//connect to mongodb
mongoose.connect(config.mongoServer);

//signal active-state to front-end
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
		
		//signal idle-state to front-end
		io.emit('status', 0);
		
		//sit idle for 5 minutes before the next try
		console.log('no more jobs remaining: application will quit in 5 minutes');
		setTimeout(function(){
			client.quit();
			mongoose.disconnect();
			io.close();
		},300000);
	});
}

eventEmitter.once('die', function(){
	//signal ungraceful-exit-state to front-end
	io.emit('status', 2);
	
	//kill all remaining jobs in queue
	belt.queue.kill();
	
	//terminate all io connections
	client.quit();
	mongoose.disconnect();
	io.close();
});

function relay(err, msg){
	if(err){
		console.log(err);
		eventEmitter.emit('die');
		return;
	}
	
	console.log(msg);
}