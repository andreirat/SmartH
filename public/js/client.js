var app = angular.module('myApp', ['btford.socket-io'])
/**
 * Initializare socket
 */
    .factory('mySocket', function (socketFactory) {
        return socketFactory();
    })

    /**
     * Servicii
     */
    .service('smartService', ['$http', function ($http) {
        this.getForecast = function (apiKey, query, noOfDays, c) {
            $http.post('http://api.apixu.com/v1/forecast.json?key=' + apiKey + '&q=' + query + '&days=' + noOfDays).then(c);
        };

        this.getPV = function (apiKey, lat, long, cap, degree, azimuth, c ) {
            $http.get('https://api.solcast.com.au/pv_power/forecasts?longitude='+long+'&latitude='+lat+'&capacity='+cap+'&tilt='+degree+'&azimuth='+azimuth+'&api_key='+apiKey).then(c);
        };

    }])

    /**
     * Controller
     */
    .controller('ArduController', function ($scope, mySocket, $timeout, $http, smartService, $interval) {
        var pvApi = 'aEJ4Q8DFzWQ0XrtdXDzM2nctiDjIr1sJ';
        $scope.pvload = false;
        var powerArray = [];
        var periodsArray = [];
        $scope.pv = {
            power: 200,
            degrees: 45,
            azimut: 0
        };

        // Cheke api meteo
        var apiKey = '461eb1eda8b24280826233659170807';
        $scope.outdoor = false;

        /**
         * Functie meteo
         */
        smartService.getForecast(apiKey, "cluj", 7, function (response) {
            $scope.weather = response.data;
            $scope.current = response.data.current;
            $scope.current.date = formatDate($scope.current.date);
            $scope.currentLocation = response.data.location;
            $scope.forecastday = response.data.forecast.forecastday;
            angular.forEach($scope.forecastday, function (d) {
                d.date = formatDate(d.date);
            })
        });

        $scope.arraysDays = [];
        $scope.getPV = function (pv) {
            console.log(pv);
            smartService.getPV(pvApi,'46.770439','23.591423', pv.power, pv.degrees, pv.azimut, function (response) {
              $scope.pvData =  computePoint(response.data, '23.591423', "Cluj Napoca");
              angular.forEach($scope.pvData, function (d) {
                  $scope.arraysDays.push(formatDate(d.date));
              });
                powerArray = [];
                periodsArray = [];
                initData($scope.pvData[0]);

            })
        };

        $scope.switchDay = function (day) {
            powerArray = [];
            periodsArray = [];
            initData($scope.pvData[day]);
        };

        function computePoint(satelliteData, longitude, city) {
            var result = [];
            var currentDay = { forecasts: [] };

            for (var i = 0; i < satelliteData.forecasts.length; i++) {
                lastForecast = $(currentDay.forecasts).get(-1);
                var date = computeLocalTime(longitude, satelliteData.forecasts[i].period_end);

                if (lastForecast && (lastForecast.endPeriod.getDay() != date.getDay()))
                {
                    currentDay.date = lastForecast.endPeriod;
                    currentDay.city = city;
                    result.push(currentDay);
                    currentDay = { forecasts: [] };
                }

                currentDay.forecasts.push({
                    endPeriod: date,
                    pv_estimate: satelliteData.forecasts[i].pv_estimate
                });
            }
            console.log(result);
            return result;

        }

        function computeLocalTime(long, dateStr) {
            var timestamp = Date.parse(dateStr);
            var date = new Date(dateStr); // GMT+3 (local)

            if (long >= -60 && long < -45) {
                date = date.addHours(-6);
            }
            if (long >= -75 && long < -60) {
                date = date.addHours(-7);
            }
            if (long >= -90 && long < -75) {
                date = date.addHours(-8);
            }
            if (long >= -105 && long < -90) {
                date = date.addHours(-9);
            }
            if (long >= -120 && long < -105) {
                date = date.addHours(-10);
            }

            return date;
        }

        /**
         * Functie formatare date
         * @param date
         * @returns {*}
         */
        function formatDate(date) {
            var d = new Date(date);
            var weekday = new Array(7);
            weekday[0] = "Duminica";
            weekday[1] = "Luni";
            weekday[2] = "Marti";
            weekday[3] = "Miercuri";
            weekday[4] = "Joi";
            weekday[5] = "Vineri";
            weekday[6] = "Sambata";

            return weekday[d.getDay()];
        }

        /**
         * Initializare LED
         * @type {[*]}
         */
        $scope.ledPins = [
            {number: 0, led: 1, status: false, color: 'red', location: 'Bucatarie'},
            {number: 1, led: 2, status: false, color: 'green', location: 'Living'}
        ];


        // Variabile
        $scope.motion = false;
        $scope.nomotion = false;


        // Opreste fiecare LED
        $scope.setOff = function () {
            angular.forEach($scope.ledPins, function (pin) {
                pin.status = false;
            })
        };

        /**
         * Functie trimitere comanda aprindere LED
         * @param p
         */
        $scope.ledOn = function (p) {
            p.status = true;
            mySocket.emit('led:on', p);
            console.log('Led ' + p.number + ' is on');
        };


        /**
         * Functie trimitere comanda stingere LED
         * @param p
         */
        $scope.ledOff = function (p) {
            p.status = false;
            mySocket.emit('led:off', p);
            console.log('Led ' + p.number + ' is off');
        };


        /**
         * Functie trimitere comanda aprindere LED-uri exterioare
         */
        $scope.OutdoorOn = function () {
            $scope.outdoor = true;
            mySocket.emit('outdoor:on', "on");
        };

        /**
         * Functie trimitere comanda stingere LED-uri exterioare
         */
        $scope.OutdoorOff = function () {
            $scope.outdoor = false;
            mySocket.emit('outdoor:off', "off");
        };


        /**
         * Functie formatare date
         * @returns {string}
         */
        Date.prototype.timeNow = function () {
            return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
        };

        $scope.hourArray = [];
        $scope.valuesArray = [];

        /**
         * Cand primeste comanda ca PIR a detectat miscare
         */
        mySocket.on('motionstart', function (data) {
            $scope.motion = true;
            var date = new Date(data);
            $scope.valuesArray.push(1);
            $scope.hourArray.push(date.timeNow());
            console.log($scope.valuesArray);
            console.log($scope.hourArray);
            chart1.series[0].setData($scope.valuesArray);
            chart1.xAxis[0].setCategories($scope.hourArray);
            // $timeout(function() {
            // angular.element("#container").highcharts().reflow();
            // }, 1);
            $scope.motionstart = date.timeNow();
        });

        /**
         * Cand primeste comanda ca PIR nu a mai detectat miscare
         */
        mySocket.on('motionend', function (data) {
            $scope.nomotion = true;
            var date = new Date(data);
            $scope.valuesArray.push(0);
            $scope.hourArray.push(date.timeNow());
            $scope.motionend = date.timeNow();
            chart1.series[0].setData($scope.valuesArray);
            chart1.xAxis[0].setCategories($scope.hourArray);
        });
        $scope.alarm = false;

        /**
         * Activare alarma
         */
        $scope.activateAlarm = function () {
            $scope.alarm = true;
            mySocket.emit('alarm:on', $scope.alarm);
        }

        /**
         * Dezactivare alarma
         */
        $scope.deactivateAlarm = function () {
            $scope.alarm = false;
            mySocket.emit('alarm:off', $scope.alarm);
        };


        $scope.setTimeLights = function () {
            var a = new Date();
            var b = new Date($scope.datalumini);
            var difference = (b - a);
            $timeout(function () {
                $scope.outdoor = true;
                mySocket.emit('outdoor:on', $scope.datalumini);
            },difference)

        };

        $scope.setTimeAlarm = function () {
            var a = new Date();
            var b = new Date($scope.dataalarma);
            var difference = (b - a);
            $timeout(function () {
                $scope.alarm = true;
                mySocket.emit('alarm:on', $scope.alarm);
            },difference)
        };

        mySocket.on("userData", function (data) {
            console.log(data);
            $scope.user = data[0];
        });



        Date.prototype.hhmm = function() {
            var m = this.getMinutes();
            var h = this.getHours();
            return (h<9?0:'')+h+':'+(m<9?0:'')+m;
        };

        /**
         * Generate arrays with power and time periods
         * @param d
         */
        function initData(d){
            for(var i = 0; i< d.forecasts.length; i++){
                if(d.forecasts[i].endPeriod.getHours()>5 && d.forecasts[i].endPeriod.getHours()<=21 ){
                    powerArray.push(parseFloat((d.forecasts[i].pv_estimate).toFixed( 2 )));
                    periodsArray.push((new Date(d.forecasts[i].endPeriod)).hhmm());
                }
            }
            $scope.pvload = true;
            chart2.series[0].setData(powerArray);
            chart2.xAxis[0].setCategories(periodsArray);
        }

        var options2 = {
            chart: {
                type: 'areaspline',
                events: {
                    load: function () {
                    }
                }
            },
            title: {
                text: 'Managementul energiei'
            },
            legend: {
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'top',
                x: 150,
                y: 100,
                floating: true,
                borderWidth: 1,
                backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#ccc'
            },
            yAxis: {
                title: {
                    text: 'Power W'
                }
            },
            tooltip: {
                shared: true,
                valueSuffix: ' W'
            },
            credits: {
                enabled: true
            },
            plotOptions: {
                areaspline: {
                    fillOpacity: 0.5
                },
                showInNavigator: true
            },
            series: [{
                name : "Generat",
                color: '#fdfe02'
            }]
        };
        var chart2 = new Highcharts.Chart('container2', options2);


        /**
         * Optiuni grafic
         */
        var options = {
            chart: {
                type: 'areaspline',
                events: {
                    load: function () {
                    }
                }
            },
            title: {
                text: 'Activitatea senzorului de miscare'
            },
            legend: {
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'top',
                x: 150,
                y: 100,
                floating: true,
                borderWidth: 1,
                backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#ccc'
            },
            yAxis: {
                title: {
                    text: 'Power W'
                }
            },
            tooltip: {
                shared: true,
                valueSuffix: ' motion'
            },
            credits: {
                enabled: true
            },
            plotOptions: {
                areaspline: {
                    fillOpacity: 0.5
                },
                showInNavigator: true
            },
            series: [{
                name: "Miscare",
                color: '#fdfe02'
            }]
        };
        var chart1 = new Highcharts.Chart('container', options);

    });