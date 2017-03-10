'use strict'

let STORAGE_KEY = 'weather_cities';
// 天气的api
let weatherInformation = 'weather';
let hourlyWeather = 'forecast';
let dailyWeather = 'forecast/daily';

let citiesLocalStorage = {
	fetch: function(){
		let cities = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
		return cities;
	},
	save: function(cityList){
		localStorage.setItem(STORAGE_KEY, JSON.stringify(cityList));
	},
	remove: function(cityName){

		let localCities = citiesLocalStorage.fetch();
		let index = -1;
		for(let i = 0; i < localCities.length; i++){
			if(localCities[i].cityName === cityName){
				index = i;
			}
		}
		localCities.splice(index, 1);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(localCities));
	}
}

let vm = new Vue({
	el: '.wrapper',
	data: {
		addedCityList: citiesLocalStorage.fetch(),
		addedCityName: '',
		weatherData: {
			weather: [{}],
			main: {},
			wind: {},
			clouds: null,
			sys: {},
			coord: {},
			sunrise: null,
			sunset: null,
			currentTime: null,
			currentDate: null
		},
		weatherDataArray: [],
		pageType: 'homePage',
		colorArr: ['#c3a6cb', '#f5be25', '#33b679', '#565d80', '#457ad1', '#89929f'],
		asideWrapperFlag: false
	},
	created(){
		this.fetchWeatherData();
	},
	methods: {
		fetchWeatherData(){
			if(this.addedCityList.length !== 0){
				this.requestAllData(this.addedCityList);
			}else {
				this.pageTypeToggle('addCityPage');
			}
		},
		addCity(){
			let samecity = false;
			this.asideWrapperFlag = false;
			let cityName = this.addedCityName;
			this.pageTypeToggle('homePage');
			let newCityName = cityName.trim();
			let cityColor = this.colorArr[parseInt(Math.random() * 6)];
			let itemCity = {
				'cityName': newCityName,
				'cityColor': cityColor
			}
			this.addedCityList.forEach(function(item){
				if(item.cityName == newCityName) {
					samecity = true;
					return
				}
			})
			if (!samecity) {
				this.addedCityList.push(itemCity);
				this.requestCityData(newCityName);
			}
			this.addedCityName = '';

		},
		removeCity(weatherData){
			let index = this.weatherDataArray.indexOf(weatherData);
			this.weatherDataArray.splice(index, 1);
			citiesLocalStorage.remove(weatherData.name.toLowerCase());
		},
		pageTypeToggle(page){
			this.pageType = page;
			console.log('当前page页是' + this.pageType);
		},
		asideWrapperShow(){
			this.asideWrapperFlag = true;
		},
		asideWrapperHide(){
			this.asideWrapperFlag = false;
		},
		getData(weatherType,cityName){
			let server_url = 'http://api.openweathermap.org/data/2.5/';
			let appId = '1ed93e49a4373ce20c3a7204d5b2fd5b';
			let dynamicData = { 'q': cityName, 'units': 'metric', 'appid': appId };

			return this.$http.get(server_url + weatherType, {params: dynamicData});
		},
		requestAllData(addedCityList){
			for(let cityItem of addedCityList){
				this.getData(weatherInformation,cityItem.cityName)
				.then((weatherData) => {
					vm.weatherData = vm.processWeatherData(weatherData.body);
					vm.weatherDataArray.push(vm.weatherData);
				}, () => {
					console.log('请求失败');
				});
			}
		},
		requestCityData(cityName){
			vm.getData(weatherInformation,cityName)
			.then((weatherData) => {
				vm.weatherData = vm.processWeatherData(weatherData.body);
				vm.weatherDataArray.push(vm.weatherData);
				}, () => {
					console.log('请求失败');
				});
		},
		// 处理天气数据格式
		processWeatherData: function (weatherData){
			weatherData.currentTime = this.formatCurrentTime();
			weatherData.currentDate = this.formatCurrentDate();
			return weatherData;
		},
		// 格式化当前时间
		formatCurrentTime: function () {
			let date = new Date();
			let hour = date.getHours() > 12 ? '下午 : ' + date.getHours() : '上午 : ' + date.getHours();
			let minutes = (date.getMinutes() < 10) ? '0' + (date.getMinutes()) : date.getMinutes();
			let currentTimeStr = hour + ' : ' + minutes;

			return currentTimeStr;
		},
		// 格式化当前日期
		formatCurrentDate: function () {
			let date = new Date();
			let year = date.getFullYear();
			let month = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
			let day = date.getDate();
			let currentTimeStr = year + '年' + month + '月' + day + '日';

			return currentTimeStr;
		},
		isSingle (cityName){

			let cities = vm.addedCityList;
			for(let i = 0; i < cities.length; i++){
				if(cityName === cities[i].cityName){
					return false;
				}
			}
			return true;
		}

	},
	watch: {
		// 数据发生改变后保存到本地
		addedCityList: {
			handler: function (addedCityList) {
				citiesLocalStorage.save(addedCityList)
			},
			deep: true
		}
	}
})








