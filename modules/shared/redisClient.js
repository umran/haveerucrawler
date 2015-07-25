var config = require('../../config.js');
var redisConfig = config.redis;
var redis = require('redis');
var client = redis.createClient(redisConfig.port, redisConfig.host);

module.exports = client;