var app = angular.module('myApp', ['btford.socket-io'])
    .factory('mySocket', function(socketFactory) {
        return socketFactory();
    })
    .service('smartService',['$http', function ($http) {

        this.getForecast = function (apiKey,query, noOfDays, c) {
            $http.post('http://api.apixu.com/v1/forecast.json?key=' + apiKey + '&q=' + query + '&days=' + noOfDays).then(c);
        };

    }])

.controller('loginController', function($scope) {
        console.log('login');
    })
    .controller('registerController', function($scope) {
        console.log('login');
    })

.controller('ArduController', function($scope, mySocket, $timeout, $http, smartService) {


    var apiKey = '461eb1eda8b24280826233659170807';
    $scope.outdoor = false;


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

    function formatDate(date){
        var d = new Date(date);
        var weekday = new Array(7);
        weekday[0] =  "Duminica";
        weekday[1] = "Luni";
        weekday[2] = "Marti";
        weekday[3] = "Miercuri";
        weekday[4] = "Joi";
        weekday[5] = "Vineri";
        weekday[6] = "Sambata";

       return weekday[d.getDay()];
    }

    //Led array
    $scope.ledPins = [
        { number: 0, led: 1, status: false, color: 'red', location: 'Bucatarie' },
        { number: 1, led: 2, status: false, color: 'green', location: 'Living' }
    ];


    //On page load , set motion divs status to false
    $scope.motion = false;
    $scope.nomotion = false;

    //Set inital rgb values
    $scope.redcolor = 0;
    $scope.greencolor = 0;
    $scope.bluecolor = 0;

    //Set rgb range values
    $scope.minrgbval = 1;
    $scope.maxrgbval = 255;

    //Set each led off
    $scope.setOff = function() {
        angular.forEach($scope.ledPins, function(pin) {
            pin.status = false;
        })
    };

    // Turn LED on
    $scope.ledOn = function(p) {
        p.status = true;
        mySocket.emit('led:on', p);
        console.log('Led ' + p.number + ' is on');
    };

    // Turn LED off
    $scope.ledOff = function(p) {
        p.status = false;
        mySocket.emit('led:off', p);
        console.log('Led ' + p.number + ' is off');
    };

    $scope.OutdoorOn = function() {
        $scope.outdoor = true;
        mySocket.emit('outdoor:on', "on");
    };
    $scope.OutdoorOff = function() {
        $scope.outdoor = false;
        mySocket.emit('outdoor:off', "off");
    };



    // For the time now
    Date.prototype.timeNow = function() {
        return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
    };
    $scope.hourArray = [];
    $scope.valuesArray = [];
    mySocket.on('motionstart', function(data) {
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
    mySocket.on('motionend', function(data) {
        $scope.nomotion = true;
        var date = new Date(data);
        $scope.valuesArray.push(0);
        $scope.hourArray.push(date.timeNow());
        $scope.motionend = date.timeNow();
        chart1.series[0].setData($scope.valuesArray);
        chart1.xAxis[0].setCategories($scope.hourArray);
    });
    $scope.alarm = false;
    $scope.activateAlarm = function() {
        $scope.alarm = true;
        mySocket.emit('alarm:on', $scope.alarm);
    }

    $scope.deactivateAlarm = function() {
        $scope.alarm = false;
        mySocket.emit('alarm:off', $scope.alarm);
    };

    $scope.setAutoLights = function() {

    }

    mySocket.on("userData", function(data) {
        console.log(data);
        $scope.user = data[0];
    });
    // $scope.setLevelText = function() {
    //     var redPercentage = Math.round((($scope.redcolor / 255) * 100), 2);
    //     var greenPercentage = Math.round((($scope.greencolor / 255) * 100), 2);
    //     var bluePergentage = Math.round((($scope.bluecolor / 255) * 100), 2);
    //     angular.element('#redPercentage').html(redPercentage + '%');
    //     angular.element('#greenPercentage').html(greenPercentage + '%');
    //     angular.element('#bluePercentage').html(bluePergentage + '%');
    //
    //     $scope.rgb = [
    //         { color: 'red', value: $scope.redcolor },
    //         { color: 'green', value: $scope.greencolor },
    //         { color: 'blue', value: $scope.bluecolor }
    //     ];
    //     mySocket.emit('rgb', $scope.rgb);
    //     console.log('Red: ' + $scope.rgb[0].value);
    //     console.log('Green: ' + $scope.rgb[1].value);
    //     console.log('Blue: ' + $scope.rgb[2].value);
    // };


    var options = {
        chart: {
            type: 'areaspline',
            events: {
                load: function() {}
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