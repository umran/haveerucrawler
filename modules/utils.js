var re = new RegExp("[\u0780-\u07BF]");

module.exports = function(){
	var self = this;
	self.getLang = function(input){
		if(re.test(input) === true){
			return 'thaana';
		}
		return 'latin';
	}
	self.convertDate = function
}