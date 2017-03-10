'use strict';

let wFlag = true;
let hFlag = true;
let dFlag = true;

// 查找的Key
let searchKey;

// 天气的api
let weatherInformation = 'weather';
let hourlyWeather = 'forecast';
let dailyWeather = 'forecast/daily';

// 图片地址和图片类型
let icon_adress = 'http://openweathermap.org/img/w/';
let icon_type = '.png';

$(document).ready(function() {
	initHeaderEvent();
});

// 初始化Header部分元素的事件
function initHeaderEvent() {

	let searchValue = $('.serchvalue');
	let btnSearch = $('.search');
	let menuItem = $('.menu_item');
	// 为搜索按钮绑定单击事件
	btnSearch.click(function() {
		resetData(searchValue);
	});

	searchValue.on({
		'keydown': function(key){
			if (key.keyCode === 13) {
				resetData(searchValue);
			}else {
				$('.alert_info').fadeOut();
			}
		},
		'focus': function(){
			$('.alert_info').fadeOut();
		}
	});
	menuItem.on({
		'mousedown': function() {
			$(this).addClass('mouse_down_already')
			.siblings().removeClass("mouse_down_already")
		},
		'mouseout': function() {
			$(this).removeClass('mouse_down_already');
		},
		'click': function() {
			$(this).addClass('selected')
			.siblings().removeClass("selected")
			let id = $(this).attr('id');
			$('.weather_' + id + '_information').addClass("active")
			.siblings().removeClass("active");
		}
	});
}

let vmWeather = new Vue({
	el: '.information',
	data: {
		weatherData: {
			weather: [{}],
			main: {},
			wind: {},
			clouds: null,
			sys: {},
			coord: {},
			sunrise: null,
			sunset: null
		},
		dailyData: {
			list: [{
				date: null,
				'isBlue': null,
				element: {
					speed: null,
					pressure: null,
					clouds: null,
					weather: [{
						imgSrc: null,
						description: null
					}],
					temp: {
						max: null,
						min: null
					}
				}
			}]
		},
		hourlyData: {
			list: [{
				date: null,
				'isToday': null,
				value: [{
					time: null,
					weather: [{
						imgSrc: null,
						description: null
					}],
					main: {
						temp: null,
						temp_max: null,
						temp_min: null,
						pressure: null
					},
					wind: {
						speed: null,
					},
					clouds: {
						all: null
					}
				}]
			}]
		}
	},

	created: function() {
		this.fetchWeatherData();
	},

	methods: {
		fetchWeatherData: function() {
			let mySelf = this;
			let myCookie = Cookies.get('city');
			if(myCookie !== searchKey){
				searchKey = myCookie;
			}else {
				searchKey = 'shanghai';
			}
			requestData(searchKey);
		}
	}
})

//处理当前天气的数据
function precessWeatherData(weatherData) {

	weatherData.imgSrc = icon_adress + weatherData.weather[0].icon + icon_type;
	weatherData.currentTime = formatCurrentTime();
	weatherData.sunrise = formatSunriseAndSunset(weatherData.sys.sunrise);
	weatherData.sunset = formatSunriseAndSunset(weatherData.sys.sunset);
	weatherData.speed = windSpeed(weatherData.wind.speed);
	weatherData.deg = windDirection(weatherData.wind.deg);
	return weatherData;
}

// 处理Daily天气的数据
function precessDailyData(dailyData){

	let result = {
		'list': []
	}

	dailyData.list.forEach( function(element) {
		let dateStr = formatDailyTime(element.dt);
		element.weather[0].img_src = icon_adress + element.weather[0].icon + icon_type;
		element.temp_min = element.temp.min.toFixed(1)
		element.temp_max = element.temp.max.toFixed(1)
		result.list.push({
			'date': dateStr,
			'isBlue': isBlue(element.temp.max),
			'element': element 
		});
	});

	
	return result;
}

// 处理Hourly天气的数据
function precessHourlyData(hourlyData) {
	let result = {
		'list': []
	}

	hourlyData.list.forEach(function(element) {
		let date = new Date(element.dt * 1000)
		let dateStr = date.toDateString()

		element.date = dateStr
		element.time = myToTime(date)
		element.weather[0].img_src = icon_adress + element.weather[0].icon + icon_type;
		element.main.temp = element.main.temp.toFixed(1)
		element.main.temp_min = element.main.temp_min.toFixed(1)
		element.main.temp_max = element.main.temp_max.toFixed(1)

		let isNotInThisDay = true
		for (let resultElement of result.list) {
			if (resultElement.date === dateStr) {
				resultElement.value.push(element)
				isNotInThisDay = false
				break;
			}
		}

		if (isNotInThisDay) {
			result.list.push({
				'date': dateStr,
				'is_today': isToday(date),
				'value': [element]
			})
		}
	})
	return result;
}

// 格式化Daily天气中的时间格式
function formatDailyTime(time){

	let date = new Date(time * 1000);
	let dailyTimeStr = formatWeek(date.getDay()) + ' ' + date.getDate() + ' ' + formatMonth(date.getMonth() + 1);
	return dailyTimeStr;
}
// 获取数据(get)
function getData(weatherType, searchKey) {
	let server_url = 'http://api.openweathermap.org/data/2.5/';
	let appId = '1ed93e49a4373ce20c3a7204d5b2fd5b';
	let dynamicData = { 'q': searchKey, 'units': 'metric', 'appid': appId };
	console.log(dynamicData);
	return $.ajax({
		url: server_url + weatherType,
		data: dynamicData
	});
}

// 判断是否小于0且修改背景为蓝色
function isBlue(maxTemp){

 return maxTemp < 0 ;
}

// 格式化当前时间
function formatCurrentTime() {
	let date = new Date();
	let year = date.getFullYear();
	let month = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
	let day = date.getDate();
	let hour = date.getHours() > 12 ? '下午' + date.getHours() : '上午' + date.getHours();
	let minutes = (date.getMinutes() < 10) ? '0' + (date.getMinutes()) : date.getMinutes();
	let currentTimeStr = year + '/' + month + '/' + day + ' ' + hour + ':' + minutes;

	return currentTimeStr;
}

// 格式化日出和日落
function formatSunriseAndSunset(sunriseOrSunset) {

	let date = new Date(sunriseOrSunset * 1000);
	let hours = formatHoursAndMinutes(date.getHours());
	let minutes = formatHoursAndMinutes(date.getMinutes())
	let sunriseOrSunsetStr = hours + ':' + minutes;
	return sunriseOrSunsetStr;
}

// 格式化小时，分钟
function formatHoursAndMinutes(hoursOrMinutes) {

	return hoursOrMinutes < 10 ? '0' + hoursOrMinutes : hoursOrMinutes;
}

/* 
 * 重置数据
 * 如果输入框值为空,searchKey不改变，还是搜索默认值上海的数据
 * 如果输入框值不为空，searchKey则为输入框的值
 */
 function resetData(searchValue) {
	let alertInfo = $('.alert_info');
	if (searchValue.val().trim() === '' || searchValue.val().indexOf(' ') >= 0) {
		alertInfo.fadeIn();
		searchValue.val('');
	} else {
		alertInfo.fadeOut();
		if (wFlag && hFlag && dFlag) {
			wFlag = false;
			hFlag = false;
			dFlag = false;

			searchKey = searchValue.val();  
			requestData(searchKey);
			Cookies.set('city', searchKey, { expires: 7 });
		}
	}
}

function requestData(searchKey){
	getData(weatherInformation, searchKey).done(function(weatherData){
		vmWeather.weatherData = precessWeatherData(weatherData);
	}).fail(function(){
	}).always(function(){
		wFlag = true;
	})
	getData(dailyWeather, searchKey).done(function(dailyData){
		vmWeather.dailyData = precessDailyData(dailyData);
	}).fail(function(){
	}).always(function(){
		dFlag = true;
	})
	getData(hourlyWeather, searchKey).done(function(hourlyData){
		vmWeather.hourlyData = precessHourlyData(hourlyData);
	}).fail(function(){
	}).always(function(){
		hFlag = true;
	})
}

function isToday(date) {
	return date.toDateString() === new Date().toDateString()
}

function myToTime(date) {
	return (date.getHours() < 10 ? '0' : '') + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
}

// 格式化星期
function formatWeek(week){

	switch (week) {
		case 0: return 'Sun';
		case 1: return 'Mon';
		case 2: return 'Tue';
		case 3: return 'Wed';
		case 4: return 'Thu';
		case 5: return 'Fri';
		case 6: return 'Sat';
	}
}
// 格式化月份
function formatMonth(month) {

	switch (month) {
		case 1: return 'Jan';
		case 2: return 'Feb';
		case 3: return 'Mar';
		case 4: return 'Apr';
		case 5: return 'May';
		case 6: return 'Jun';
		case 7: return 'Jul';
		case 8: return 'Aug';
		case 9: return 'Sep';
		case 10: return 'Oct';
		case 11: return 'Nov';
		case 12: return 'Dec';
	}
}

// 风速判断
function windSpeed(data) {
	let speedStr = '';
	if (data >= 0 && data <= 0.2) {
		speedStr = 'Calm';
	} else if (data >= 0.3 && data <= 1.5) {
		speedStr = 'Light air';
	} else if (data >= 1.6 && data <= 3.3) {
		speedStr = 'Light breeze';
	} else if (data >= 3.4 && data <= 5.4) {
		speedStr = 'Gentle breeze';
	} else if (data >= 5.5 && data <= 7.9) {
		speedStr = 'Moderate breeze';
	} else if (data >= 8.0 && data <= 10.7) {
		speedStr = 'Fresh breeze';
	} else if (data >= 10.8 && data <= 13.8) {
		speedStr = 'Strong breeze';
	} else if (data >= 13.9 && data <= 17.1) {
		speedStr = 'Moderate gale';
	} else if (data >= 17.2 && data <= 20.7) {
		speedStr = 'Fresh gale';
	} else if (data >= 20.8 && data <= 24.4) {
		speedStr = 'Strong gale';
	} else if (data >= 24.5 && data <= 28.4) {
		speedStr = 'Whole gale';
	} else if (data >= 28.5 && data <= 32.6) {
		speedStr = 'Storm';
	}
	return speedStr;
}
// 风向判断
function windDirection(data) {
	let direct = '';

	if (data >= 11.26 && data <= 33.75) {
		direct = 'North-northeast';
	} else if (data >= 33.76 && data <= 56.25) {
		direct = 'NorthEast';
	} else if (data >= 56.26 && data <= 78.75) {
		direct = 'East-northeast';
	} else if (data >= 78.76 && data <= 101.25) {
		direct = 'East';
	} else if (data >= 101.26 && data <= 123.75) {
		direct = 'East-southeast';
	} else if (data >= 123.76 && data <= 146.25) {
		direct = 'SouthEast';
	} else if (data >= 146.26 && data <= 168.75) {
		direct = 'South-southeast';
	} else if (data >= 168.76 && data <= 191.25) {
		direct = 'South';
	} else if (data >= 191.26 && data <= 213.75) {
		direct = 'South-southwest';
	} else if (data >= 213.76 && data <= 236.25) {
		direct = 'SouthWest';
	} else if (data >= 236.26 && data <= 258.75) {
		direct = 'West-southwest';
	} else if (data >= 258.76 && data <= 281.25) {
		direct = 'West';
	} else if (data >= 281.26 && data <= 303.75) {
		direct = 'West-northwest';
	} else if (data >= 303.76 && data <= 326.25) {
		direct = 'NorthWest';
	} else if (data >= 326.26 && data <= 348.75) {
		direct = 'North-northwest';
	} else {
		direct = 'North';
	}
	return direct;
}
