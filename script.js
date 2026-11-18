
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");

const statusMessage = document.getElementById("statusMessage");

const locationName = document.getElementById("locationName");
const currentDate = document.getElementById("currentDate");

const temperature = document.getElementById("temperature");
const weatherDescription =
  document.getElementById("weatherDescription");

const feelsLike = document.getElementById("feelsLike");
const weatherIcon = document.getElementById("weatherIcon");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const precipitation = document.getElementById("precipitation");
const uvIndex = document.getElementById("uvIndex");

const forecastContainer =
  document.getElementById("forecastContainer");

// DEFAULT CITY

const DEFAULT_CITY = "Lahore";

let requestId = 0;

// WEATHER CODES

function getWeatherInfo(code, isDay = true) {
  const weatherCodes = {
    0: ["Clear sky", isDay ? "☀️" : "🌙"],
    1: ["Mainly clear", isDay ? "🌤️" : "🌙"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Foggy", "🌫️"],
    48: ["Rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Moderate drizzle", "🌧️"],
    55: ["Dense drizzle", "🌧️"],
    56: ["Freezing drizzle", "🌧️"],
    57: ["Dense freezing drizzle", "🌧️"],
    61: ["Slight rain", "🌧️"],
    63: ["Moderate rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    66: ["Freezing rain", "🌧️"],
    67: ["Heavy freezing rain", "🌧️"],
    71: ["Slight snow", "🌨️"],
    73: ["Moderate snow", "🌨️"],
    75: ["Heavy snow", "❄️"],
    77: ["Snow grains", "❄️"],
    80: ["Slight rain showers", "🌦️"],
    81: ["Moderate rain showers", "🌧️"],
    82: ["Violent rain showers", "⛈️"],
    85: ["Snow showers", "🌨️"],
    86: ["Heavy snow showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with hail", "⛈️"],
    99: ["Thunderstorm with heavy hail", "⛈️"]
  };

  const info = weatherCodes[code] || ["Unknown", "☁️"];

  return {
    description: info[0],
    icon: info[1]
  };
}

// API HELPER

async function fetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Weather service unavailable. Please try again."
    );
  }

  return response.json();
}

// SEARCH CITY

async function searchCity(city) {
  const params = new URLSearchParams({
    name: city,
    count: "10",
    language: "en",
    format: "json"
  });

  const url =
    "https://geocoding-api.open-meteo.com/v1/search?" +
    params.toString();

  const data = await fetchJSON(url);

  if (!data.results || data.results.length === 0) {
    throw new Error(
      "City not found. Please enter a valid city name."
    );
  }

  // Prefer Lahore in Pakistan
  if (city.toLowerCase() === "lahore") {
    return (
      data.results.find(
        location => location.country_code === "PK"
      ) || data.results[0]
    );
  }

  return data.results[0];
}

// FETCH LIVE WEATHER

async function fetchWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),

    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m"
    ].join(","),

    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "uv_index_max"
    ].join(","),

    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timezone: "auto",
    forecast_days: "7"
  });

  const url =
    "https://api.open-meteo.com/v1/forecast?" +
    params.toString();

  const data = await fetchJSON(url);

  if (!data.current || !data.daily) {
    throw new Error("Incomplete weather data received.");
  }

  return data;
}

// FORMAT DATE

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString + "T12:00:00");

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// FORMAT TEMPERATURE

function formatTemp(value) {
  if (value === null || value === undefined) {
    return "--";
  }

  return Math.round(value);
}

// CREATE FORECAST CARD

function createForecastCard(index, daily) {
  const date = new Date(
    daily.time[index] + "T12:00:00"
  );

  const dayName = index === 0
    ? "Today"
    : date.toLocaleDateString("en-US", {
        weekday: "short"
      });

  const info = getWeatherInfo(
    daily.weather_code[index]
  );

  const card = document.createElement("div");
  card.className = "forecast-day";

  const name = document.createElement("span");
  name.className = "day-name";
  name.textContent = dayName;

  const icon = document.createElement("span");
  icon.className = "day-icon";
  icon.textContent = info.icon;

  const temp = document.createElement("strong");
  temp.className = "day-temperature";

  temp.textContent =
    formatTemp(daily.temperature_2m_max[index]) +
    "° / " +
    formatTemp(daily.temperature_2m_min[index]) +
    "°";

  const description = document.createElement("span");
  description.className = "day-description";
  description.textContent = info.description;

  card.append(name, icon, temp, description);

  return card;
}

// RENDER WEATHER

function renderWeather(location, data) {
  const current = data.current;
  const daily = data.daily;

  const locationParts = [
    location.name,
    location.admin1,
    location.country
  ].filter(Boolean);

  locationName.textContent = [
    ...new Set(locationParts)
  ].join(", ");

  currentDate.textContent = formatDate(
    daily.time[0]
  );

  temperature.textContent = formatTemp(
    current.temperature_2m
  );

  const info = getWeatherInfo(
    current.weather_code,
    current.is_day === 1
  );

  weatherDescription.textContent = info.description;
  weatherIcon.textContent = info.icon;

  feelsLike.textContent =
    formatTemp(current.apparent_temperature) + "°C";

  humidity.textContent =
    current.relative_humidity_2m == null
      ? "--"
      : current.relative_humidity_2m + "%";

  windSpeed.textContent =
    current.wind_speed_10m == null
      ? "--"
      : current.wind_speed_10m + " km/h";

  precipitation.textContent =
    current.precipitation == null
      ? "--"
      : current.precipitation + " mm";

  const uv = daily.uv_index_max[0];

  uvIndex.textContent =
    uv == null ? "--" : Number(uv).toFixed(2);

  forecastContainer.replaceChildren();

  for (let i = 0; i < daily.time.length; i++) {
    forecastContainer.appendChild(
      createForecastCard(i, daily)
    );
  }
}

// LOAD WEATHER

async function loadWeather(city) {
  const currentRequest = ++requestId;

  statusMessage.textContent = "Loading weather...";
  searchButton.disabled = true;
  searchButton.textContent = "Loading...";

  try {
    const location = await searchCity(city);

    const weather = await fetchWeather(
      location.latitude,
      location.longitude
    );

    if (currentRequest !== requestId) return;

    renderWeather(location, weather);
    statusMessage.textContent = "";

  } catch (error) {
    if (currentRequest !== requestId) return;

    statusMessage.textContent = error.message;
    console.error("Weather error:", error);

  } finally {
    if (currentRequest === requestId) {
      searchButton.disabled = false;
      searchButton.textContent = "Search →";
    }
  }
}

// SEARCH EVENT

searchForm.addEventListener("submit", event => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) return;

  loadWeather(city);
});

// INITIALIZE

loadWeather(DEFAULT_CITY);
