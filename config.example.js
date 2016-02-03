var config = {};

config.redis = {};

// redis host -- this is a string
config.redis.host = 'localhost';

// redis port -- this is an integer
config.redis.port = 6379;

// path to mongodb database -- this is a string
config.mongoServer = 'mongodb://localhost/haveeruexaminer';

// configuration for elasticsearch cluster
config.elasticServer = {
	host: 'http://@localhost:9200'
}

// path to socket.io server -- this is a string
config.ioServer = 'http://localhost:3080';

module.exports = config;