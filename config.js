var config = {};

config.redis = {};

// redis host -- this is a string
config.redis.host = 'localhost';

// redis port -- this is an integer
config.redis.port = 6379;

// path to mongodb database -- this is a string
config.mongoServer = 'mongodb://localhost/haveeruexaminer';

// path to elasticsearch server(s) -- this is an array containing strings which must be comma-separated
config.elasticServer = ['localhost:9200'];

module.exports = config;