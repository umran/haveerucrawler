var Doc = require('./models/doc');

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
		return;
	}
	console.log('new elasticsearch index called docs created');
});