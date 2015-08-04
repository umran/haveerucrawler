var config = require('./config.js');
var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
mongoose.connect(config.mongoServer);

var docSchema = new mongoose.Schema({
	url: {type: String, unique: true, required: true},
  r_title: {type: String, required: false, es_indexed:true, es_analyzer:'english'},
  r_byline: {type: String, required: false},
  r_date: {type: String, required: false},
  r_intro: {type: String, required: false, es_indexed:true, es_analyzer:'english'},
  r_main: {type: String, required: false},
  fulltext: {type: String, required: false, es_indexed:true, es_analyzer:'english'},
  hash: {type: String, required: true, es_indexed:true, es_index:'not_analyzed'},
  dup_filter: {type: String, required: true, es_indexed:true, es_index:'not_analyzed'}
});

docSchema.plugin(mongoosastic, {
	hosts: config.elasticServer
});

var Doc = mongoose.model('Doc', docSchema);

Doc.createMapping(
{
	"analysis": {
		"filter": {
			"english_stop": {
				"type": "stop",
				"stopwords": "_english_" 
			},
			"english_stemmer": {
				"type": "stemmer",
				"language": "english"
			},
			"english_possessive_stemmer": {
				"type": "stemmer",
				"language": "possessive_english"
			}
		},
		"analyzer": {
			"english": {
				"tokenizer":  "standard",
				"filter": [
					"english_possessive_stemmer",
					"lowercase",
					"english_stop",
					"english_stemmer"
				]
			}
		}
	}
},function(err, mapping){
	if(err){
		console.log(err);
		mongoose.disconnect();
		return;
	}
	console.log('new elasticsearch index called docs created');
	mongoose.disconnect();
});