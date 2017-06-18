var app = angular.module('myApp', ['btford.socket-io'])
    .factory('mySocket', function(socketFactory) {
        return socketFactory();
    })

.controller('loginController', function($scope) {
        console.log('login');
    })
    .controller('registerController', function($scope) {
        console.log('login');
    })

.controller('ArduController', function($scope, mySocket, $timeout) {
    //Led array
    $scope.ledPins = [
        { number: 0, led: 1, status: false, color: 'red', location: 'Bucatarie' },
        { number: 1, led: 2, status: false, color: 'green', location: 'Living' }
    ];


    $scope.lcdtext = '';
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

    angular.forEach($scope.ledPins, function(pin) {
        console.log(pin);
    });

    $scope.ledOn = function(p) {
        p.status = true;
        mySocket.emit('led:on', p);
        console.log('Led ' + p.number + ' is on');
    };


    $scope.ledOff = function(p) {
        p.status = false;
        mySocket.emit('led:off', p);
        console.log('Led ' + p.number + ' is off');
    };

    mySocket.on('joystick', function(axis) {
        $scope.joystickDirectionX = axis.x;
        $scope.joystickDirectionY = axis.y;
    });

    // For the time now
    Date.prototype.timeNow = function() {
        return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
    }
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
        mySocket.emit('alarm', $scope.alarm);
    }

    $scope.deactivateAlarm = function() {
        $scope.alarm = false;
        console.log($scope.alarm);
        mySocket.emit('alarm', $scope.alarm);
    };

    $scope.setAutoLights = function() {

    }

    mySocket.on("userData", function(data) {
        console.log(data);
        $scope.user = data[0];
    });
    $scope.setLevelText = function() {
        var redPercentage = Math.round((($scope.redcolor / 255) * 100), 2);
        var greenPercentage = Math.round((($scope.greencolor / 255) * 100), 2);
        var bluePergentage = Math.round((($scope.bluecolor / 255) * 100), 2);
        angular.element('#redPercentage').html(redPercentage + '%');
        angular.element('#greenPercentage').html(greenPercentage + '%');
        angular.element('#bluePercentage').html(bluePergentage + '%');

        $scope.rgb = [
            { color: 'red', value: $scope.redcolor },
            { color: 'green', value: $scope.greencolor },
            { color: 'blue', value: $scope.bluecolor }
        ];
        mySocket.emit('rgb', $scope.rgb);
        console.log('Red: ' + $scope.rgb[0].value);
        console.log('Green: ' + $scope.rgb[1].value);
        console.log('Blue: ' + $scope.rgb[2].value);
    };

    $scope.pushText = function() {
        console.log($scope.lcdtext);
        mySocket.emit('pushText', $scope.lcdtext);
    };

    $scope.clearText = function() {
        $scope.lcdtext = '';
        mySocket.emit('clearText');
    };

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