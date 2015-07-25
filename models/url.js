var mongoose = require('mongoose');

var urlSchema = new mongoose.Schema({
	url: {type: String, unique: true, required: true}
});

var Url = mongoose.model('Url', urlSchema);

module.exports = Url;