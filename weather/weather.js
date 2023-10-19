const axios = require('axios')
const API_BASE_URL = 'http://api.weatherapi.com/v1/forecast.json';

const getWeatherDataByLocation = (location, callback) => {
    try {
        axios.get(API_BASE_URL, {
            params: {
                key: "9b94cb46d2f04e048e615153231910",
                q: location
            }
        }).then((result) => {
            console.log(result.data)
            let responseData = {
                location: result.data.location.name + ", " + result.data.location.region + ", " + result.data.location.country,
                weather_condition: result.data.current.condition.text
            }
            console.log(responseData)
            callback(null, responseData)
        }).catch((err) => {
            console.log(err)
            callback({
                error: "Failed to get weather data."
            })
        })
    } catch (error) {
        console.log(error)
        callback({
            error: "Failed to get weather data."
        })
    }
}

// getWeatherDataByLocation("pune", () => {})

module.exports = {
    getWeatherForecast: getWeatherDataByLocation
}