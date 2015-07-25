var config = require('../config.js');
var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');

var docSchema = new mongoose.Schema({
	url: {type: String, unique: true, required: true},
  r_title: {type: String, required: false, es_indexed:true},
  r_byline: {type: String, required: false},
  r_date: {type: String, required: false},
  r_intro: {type: String, required: false, es_indexed:true},
  r_main: {type: String, required: false},
  fulltext: {type: String, required: false, es_indexed:true},
  hash: {type: String, required: true}
});

docSchema.plugin(mongoosastic, {
	hosts: config.elasticServer
});

var Doc = mongoose.model('Doc', docSchema);

module.exports = Doc;