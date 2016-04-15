var config = require('../config.js');
var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');

var docSchema = new mongoose.Schema({
  url: {type: String, unique: true, required: true, es_indexed:true, es_index:'not_analyzed'},
  r_title: {type: String, required: false, es_indexed:true, es_analyzer:'english'},
  r_byline: {type: String, required: false, es_indexed:true, es_analyzer:'english'},
  r_date: {type: String, required: false},
  date: {type:Date, es_type:'date', es_indexed:true, required: false},
  indexed_date: {type:Date, es_type:'date', es_indexed:true, required: false},
  r_intro: {type: String, required: false, es_indexed:true, es_analyzer:'english'},
  r_main: {type: String, required: false},
  fulltext: {type: String, required: false, es_indexed:true, es_analyzer:'english'},
  hash: {type: String, required: true, es_indexed:true, es_index:'not_analyzed'},
  dup_filter: {type: String, required: true, es_indexed:true, es_index:'not_analyzed'}
});

docSchema.plugin(mongoosastic, config.elasticServer);

var Doc = mongoose.model('Doc', docSchema);

module.exports = Doc;