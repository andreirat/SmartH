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

.controller('ArduController', function($scope, mySocket) {
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

    mySocket.on('motionstart', function(data) {
        $scope.motion = true;
        var date = new Date(data);
        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        if (h < 9) {
            h = '0' + h;
        } else if (m < 9) {
            m = '0' + m;
        } else if (s < 9) {
            s = '0' + s;
        }
        $scope.motionstart = h + ':' + m + ':' + s;

        console.log('motionstart', h + ':' + m + ':' + s);
    });
    mySocket.on('motionend', function(data) {
        $scope.nomotion = true;
        var date = new Date(data);
        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        if (h < 9) {
            h = '0' + h;
        } else if (m < 9) {
            m = '0' + m;
        } else if (s < 9) {
            s = '0' + s;
        }
        $scope.motionend = h + ':' + m + ':' + s;

        console.log('motionend', data);
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

});