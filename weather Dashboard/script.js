const apiKey = 'e0f51ea974bc3c9f32d9498c9845d1af'; 
const cityInput = document.getElementById('city-input');
const getWeatherBtn = document.getElementById('get-weather');
const useLocationBtn = document.getElementById('current-location');
const weatherDisplay = document.getElementById('weather-display');
const cityName = document.getElementById('city-name');
const weatherIcon = document.getElementById('weather-icon');
const description = document.getElementById('description');
const temperature = document.getElementById('temperature');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const forecastCards = document.getElementById('forecast-cards');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const themeToggle = document.getElementById('theme-toggle');
const celsiusBtn = document.getElementById('celsius');
const fahrenheitBtn = document.getElementById('fahrenheit');
const suggestionsList = document.getElementById('suggestions');

let currentUnit = 'metric';
loading.style.display = 'none';

function displayError(msg) {
  errorDiv.textContent = msg;
  loading.style.display = 'none';
  weatherDisplay.classList.add('hidden');
}

function fetchWeather(city, unit = 'metric') {
  loading.style.display = 'block';
  errorDiv.textContent = '';
  suggestionsList.classList.add('hidden');

  const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${apiKey}`;

  Promise.all([
    fetch(weatherURL).then(res => res.json()),
    fetch(forecastURL).then(res => res.json())
  ])
    .then(([weather, forecast]) => {
      if (weather.cod !== 200) {
        throw new Error(weather.message);
      }

      cityName.textContent = weather.name;
      description.textContent = weather.weather[0].description;
      temperature.textContent = `Temperature: ${weather.main.temp}°${unit === 'metric' ? 'C' : 'F'}`;
      humidity.textContent = `Humidity: ${weather.main.humidity}%`;
      windSpeed.textContent = `Wind Speed: ${weather.wind.speed} ${unit === 'metric' ? 'm/s' : 'mph'}`;
      weatherIcon.src = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;

      // Save to localStorage
      localStorage.setItem('lastCity', city);

      displayForecast(forecast);
      weatherDisplay.classList.remove('hidden');
      loading.style.display = 'none';
    })
    .catch(err => {
      displayError('Error fetching weather: ' + err.message);
    });
}

function displayForecast(data) {
  forecastCards.innerHTML = '';
  const filtered = data.list.filter(item => item.dt_txt.includes('12:00:00'));

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('forecast-card');
    card.innerHTML = `
      <p>${new Date(item.dt_txt).toLocaleDateString()}</p>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" />
      <p>${item.weather[0].description}</p>
      <p>${item.main.temp}°</p>
    `;
    forecastCards.appendChild(card);
  });
}

// Suggestion logic
cityInput.addEventListener('input', () => {
  const query = cityInput.value.trim();
  if (query.length < 2) {
    suggestionsList.classList.add('hidden');
    return;
  }

  const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`;
  fetch(geoURL)
    .then(res => res.json())
    .then(data => {
      suggestionsList.innerHTML = '';
      if (data.length === 0) {
        suggestionsList.classList.add('hidden');
        return;
      }

      data.forEach(place => {
        const li = document.createElement('li');
        li.textContent = `${place.name}, ${place.state || ''} ${place.country}`;
        li.addEventListener('click', () => {
          cityInput.value = place.name;
          suggestionsList.classList.add('hidden');
          fetchWeather(place.name, currentUnit);
        });
        suggestionsList.appendChild(li);
      });

      suggestionsList.classList.remove('hidden');
    })
    .catch(() => {
      suggestionsList.classList.add('hidden');
    });
});

// Button Listeners
getWeatherBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city, currentUnit);
});

cityInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    getWeatherBtn.click();
  }
});

useLocationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    displayError('Geolocation not supported');
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=${currentUnit}&appid=${apiKey}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        fetchWeather(data.name, currentUnit);
      });
  }, () => displayError('Permission denied or failed to get location.'));
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

// Unit Toggle
celsiusBtn.addEventListener('click', () => {
  currentUnit = 'metric';
  if (localStorage.getItem('lastCity')) {
    fetchWeather(localStorage.getItem('lastCity'), currentUnit);
  }
});
fahrenheitBtn.addEventListener('click', () => {
  currentUnit = 'imperial';
  if (localStorage.getItem('lastCity')) {
    fetchWeather(localStorage.getItem('lastCity'), currentUnit);
  }
});

// Load last city on page load
window.addEventListener('load', () => {
  const lastCity = localStorage.getItem('lastCity');
  if (lastCity) {
    fetchWeather(lastCity, currentUnit);
  }
});
