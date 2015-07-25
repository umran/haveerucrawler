# haveerucrawler
A crawler that fetches and indexes articles from Haveeru. Written for node js on top of redis, mongodb and elasticsearch

### Dependencies

* mongodb
* redis
* elasticsearch

### Usage

#### Configuring the Crawler

Configuration is pretty straightforward. It's just a matter of updating config.js with the relevant hostnames and port numbers for redis, mongodb and elasticsearch instances

#### Setting Up the Schema and Index

Once everything is configured, run setup.js like so:

```
$ node setup
```
This is a crucial step as it creates the necessary schema and index in mongodb and elasticsearch respectively.

#### Runing the Crawler
To run the application, simply do:

```
$ node index
```
