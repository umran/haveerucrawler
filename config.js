var config = {};

config.redis = {}

//redis host -- this is a string
config.redis.host = '127.0.0.1';

//redis port -- this is an integer
config.redis.port = 6379;

//path to mongodb database -- this is a string
config.mongoServer = 'mongodb://localhost/dummy';

//path to elastic search server or multiple servers -- this is an array containing strings which must be comma separated
config.elasticServer = ['localhost:9200'];

module.exports = config;