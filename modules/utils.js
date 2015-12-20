var re = new RegExp("[\u0780-\u07BF]");
var dictionary = require('./dictionary');
var months = dictionary.months;

module.exports = function(){
	this.getLang = function(input){
		if(re.test(input) === true){
			return 'thaana';
		}
		return 'latin';
	}
	this.isValidDate = function(d){
		if(Object.prototype.toString.call(d) === "[object Date]"){
			// it is a date
			if(isNaN(d.getTime())) {  // d.valueOf() could also work
				// date is not valid
				return false;
			}
			else {
				// date is valid
				return true;
			}
		}
		else {
			// not a date
			return false;
		}
	}
	this.convertDate = function(input){
		var date
		  , month
		  , year
		  , hour
		  , minute
		  , second = '00'
		  , useful = input.replace(/[:\,\-\_\s]/gi, '');
		if(this.getLang(input) === 'latin'){
			
			// do english date conversion
			if(useful.substring(0, 3).toLowerCase().indexOf('jan') > -1){
				month = 'January';
				
			} else if(useful.substring(0, 3).toLowerCase().indexOf('feb') > -1){
				month = 'February';
				
			} else if(useful.substring(0, 3).toLowerCase().indexOf('mar') > -1){
				month = 'March';
				
			} else if(useful.substring(0, 3).toLowerCase().indexOf('apr') > -1){
				month = 'April';
				
			} else if(useful.substring(0, 3).toLowerCase().indexOf('may') > -1){
				month = 'May';
				
			} else if(useful.substring(0, 3).toLowerCase().indexOf('jun') > -1){
				month = 'June';
				
			} else if(useful.substring(0, 3).toLowerCase().indexOf('jul') > -1){
				month = 'July';
				
			} else if(useful.substring(0, 3).toLowerCase().indexOf('aug') > -1){
				month = 'August';
				
			} else if(useful.substring(0, 3).toLowerCase().indexOf('sep') > -1){
				month = 'September';
				
			} else if(useful.substring(0, 3).toLowerCase().indexOf('oct') > -1){
				month = 'October';
				
			} else if(useful.substring(0, 3).toLowerCase().indexOf('nov') > -1){
				month = 'November';
				
			} else if(useful.substring(0, 3).toLowerCase().indexOf('dec') > -1){
				month = 'December';
				
			}	
			
			date = useful.substr(3, 2);
			year = useful.substr(5, 4);
			hour = useful.substr(9, 2);
			minute = useful.substr(11, 2);
			
			var datestring = month+' '+date+', '+year+' '+hour+':'+minute+':'+second+' +0500';
			var d = new Date(datestring);
			
			if(this.isValidDate(d)){
				return d.toISOString();
			} else{
				return false;
			}
		}
		
		// do thaana date conversion 
		
		// determine date format
		if(useful.indexOf(dictionary.formats.deprecated1) > -1){
			// do special case matching
			useful = useful.substring(13, useful.length);
		} else if(useful.indexOf(dictionary.formats.deprecated2) > -1){
			// do special case matching
			useful = useful.substring(17, useful.length);
		} else if(useful.indexOf(dictionary.formats.deprecated3) > -1){
			// do special case matching
			useful = useful.substring(19, useful.length);
		}
		
		// do general case matching
		date = useful.substr(0,2);
		var cont;
		
		if(useful.substring(2, useful.length).indexOf(months.jan) > -1){
			month = 'January';
			cont = 10;
		} else if(useful.substring(2, useful.length).indexOf(months.feb) > -1){
			month = 'February';
			cont = 12;
		} else if(useful.substring(2, useful.length).indexOf(months.mar) > -1){
			month = 'March';
			cont = 6;
		} else if(useful.substring(2, useful.length).indexOf(months.apr) > -1){
			month = 'April';
			cont = 10;
		} else if(useful.substring(2, useful.length).indexOf(months.may) > -1){
			month = 'May';
			cont = 6;
		} else if(useful.substring(2, useful.length).indexOf(months.jun) > -1){
			month = 'June';
			cont = 6;
		} else if(useful.substring(2, useful.length).indexOf(months.jul) > -1){
			month = 'July';
			cont = 8;
		} else if(useful.substring(2, useful.length).indexOf(months.aug) > -1){
			month = 'August';
			cont = 10;
		} else if(useful.substring(2, useful.length).indexOf(months.sep) > -1){
			month = 'September';
			cont = 13;
		} else if(useful.substring(2, useful.length).indexOf(months.oct) > -1){
			month = 'October';
			cont = 11;
		} else if(useful.substring(2, useful.length).indexOf(months.nov) > -1){
			month = 'November';
			cont = 11;
		} else if(useful.substring(2, useful.length).indexOf(months.dec) > -1){
			month = 'December';
			cont = 11;
		}
		
		year = useful.substr(cont, 4);
		hour = useful.substr(cont+4, 2);
		minute = useful.substr(cont+6, 2);
		
		var datestring = month+' '+date+', '+year+' '+hour+':'+minute+':'+second+' +0500';
		var d = new Date(datestring);
		
		if(this.isValidDate(d)){
			return d.toISOString();
		} else{
			return false;
		}
	}	
}