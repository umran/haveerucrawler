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

/* path to elastic search server or multiple servers -- this is an array containing strings which must be comma separated */
config.elasticServer = ['localhost:9200', 'anotherhost:9200'];
```

#### Set Up the Schema and Index

Once everything is configured, run setup.js like so:

```
$ node setup
```
This is a crucial step as it creates the necessary schema and index in mongodb and elasticsearch respectively.

#### Start the Application
To run the application, simply do:

```
$ node index
```
