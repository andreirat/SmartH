ForecastService = function (apiKey) {
    var _url = "https://api.solcast.com.au/pv_power/forecasts?capacity=200&format=json&api_key=" + apiKey;
    
    Date.prototype.addHours = function(h) {    
        this.setTime(this.getTime() + (h*60*60*1000)); 
        return this;   
    }

    this.get = function (lat, long,city, callback) {
        var requestUrl = _url + "&longitude=" + long + "&latitude=" + lat;
        $.ajax({
            type: 'GET',
            url: requestUrl,
            success: function(data) {
                  forecast = computePoint(data, long,city);
                  callback(forecast)
              }
        });
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
}