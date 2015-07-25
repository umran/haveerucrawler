# haveerucrawler
A crawler that fetches and indexes articles from Haveeru. Written for node js on top of redis, mongodb and elasticsearch

### Dependencies
The following services are required to run the crawler

* mongodb
* redis
* elasticsearch

### Installation and Usage

Do the following after cloning into or downloading haveerucrawler

#### Install Package Dependencies

To install dependencies, cd into the application root directory and run npm install like so:

```
$ cd /path/to/haveeruexaminer
$ npm install
```

#### Configure the Crawler

Configuration is pretty straightforward. It's just a matter of updating config.js with the relevant hostnames and port numbers for redis, mongodb and elasticsearch instances

```
/* redis host -- this is a string */
config.redis.host = '127.0.0.1';

/* redis port -- this is an integer */
config.redis.port = 6379;

/* path to mongodb database -- this is a string */
config.mongoServer = 'mongodb://localhost/database';

/* path to elasticsearch server(s) -- this is an array containing strings which must be comma-separated */
config.elasticServer = ['localhost:9200', 'anotherhost:9200'];
```

#### Set up the Index and Run Application

This is a crucial step as it creates the necessary index in elasticsearch. Make sure to do this before running the crawler 
Run setup.js like so:

```
$ node setup
```

Finally, to start the crawler simply do:

```
$ node index
```
