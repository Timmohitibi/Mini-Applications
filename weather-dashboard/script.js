// Mock weather data for demo (replace with real API)
const mockWeatherData = {
    'london': { temp: 15, feelsLike: 13, humidity: 65, description: 'Cloudy' },
    'paris': { temp: 18, feelsLike: 16, humidity: 58, description: 'Partly cloudy' },
    'tokyo': { temp: 22, feelsLike: 24, humidity: 72, description: 'Sunny' },
    'new york': { temp: 12, feelsLike: 10, humidity: 45, description: 'Clear' },
    'sydney': { temp: 25, feelsLike: 27, humidity: 68, description: 'Sunny' }
};

function getWeather() {
    const cityInput = document.getElementById('cityInput');
    const city = cityInput.value.trim().toLowerCase();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    // Simulate API call delay
    setTimeout(() => {
        const weatherData = mockWeatherData[city];
        
        if (weatherData) {
            displayWeather(city, weatherData);
            hideError();
        } else {
            showError('City not found. Try: London, Paris, Tokyo, New York, or Sydney');
            hideWeatherCard();
        }
    }, 500);
}

function displayWeather(city, data) {
    document.getElementById('cityName').textContent = capitalizeCity(city);
    document.getElementById('temp').textContent = data.temp;
    document.getElementById('feelsLike').textContent = data.feelsLike;
    document.getElementById('humidity').textContent = data.humidity;
    document.getElementById('description').textContent = data.description;
    
    document.getElementById('weatherCard').classList.remove('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function hideWeatherCard() {
    document.getElementById('weatherCard').classList.add('hidden');
}

function capitalizeCity(city) {
    return city.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getWeather();
    }
});