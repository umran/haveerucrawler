var config = require('../config');
var mongoose = require('mongoose');
mongoose.connect(config.mongoServer);
var Doc = require('../models/doc');

// flush index
/*Doc.esTruncate(function(err){
	if(err){
		console.log(err);
		return;
	}
	console.log('success!');
});*/

// synchronize index

var stream = Doc.synchronize()
  , count = 0;

stream.on('data', function(err, doc){
  console.log('data')
  count++;
});
stream.on('close', function(){
  console.log('indexed ' + count + ' documents!');
  mongoose.disconnect();
});
stream.on('error', function(err){
  console.log(err);
});
