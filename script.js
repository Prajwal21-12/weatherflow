const API_KEY = "3d9576ea51f6547d1f1b439bfc96e3e4";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-btn");
const message = document.getElementById("message");

const currentWeather = document.getElementById("current-weather");
const forecastSection = document.getElementById("forecast-section");

const elements = {
  city: document.getElementById("city-name"),
  description: document.getElementById("weather-description"),
  temperature: document.getElementById("temperature"),
  feelsLike: document.getElementById("feels-like"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind-speed"),
  pressure: document.getElementById("pressure"),
  icon: document.getElementById("weather-icon"),
  forecast: document.getElementById("forecast")
};

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    showMessage("Please enter a city name.", "error");
    return;
  }

  if (API_KEY === "YOUR_API_KEY_HERE") {
    showMessage("Add your OpenWeatherMap API key in script.js first.", "error");
    return;
  }

  setLoading(true);
  showMessage(`Fetching weather for ${city}...`);
  currentWeather.hidden = true;
  forecastSection.hidden = true;

  try {
    const [current, forecast] = await Promise.all([
      fetchWeather(`${BASE_URL}/weather`, { q: city }),
      fetchWeather(`${BASE_URL}/forecast`, { q: city })
    ]);

    renderCurrentWeather(current);
    renderForecast(forecast);

    currentWeather.hidden = false;
    forecastSection.hidden = false;

    updateBackground(current.weather[0].main);
    showMessage(`Weather updated for ${current.name}, ${current.sys.country}.`, "success");
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    setLoading(false);
  }
});

async function fetchWeather(endpoint, params) {
  const query = new URLSearchParams({
    ...params,
    appid: API_KEY,
    units: "metric"
  });

  const response = await fetch(`${endpoint}?${query}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("City not found. Check the spelling and try again.");
    }

    if (response.status === 401) {
      throw new Error("API key is invalid or not active yet. Check your key and try again later.");
    }

    if (response.status === 429) {
      throw new Error("Too many API requests. Please wait and try again.");
    }

    throw new Error("Unable to retrieve weather data. Please try again.");
  }

  return response.json();
}

function renderCurrentWeather(data) {
  elements.city.textContent = `${data.name}, ${data.sys.country}`;
  elements.description.textContent = data.weather[0].description;
  elements.temperature.textContent = Math.round(data.main.temp);
  elements.feelsLike.textContent = Math.round(data.main.feels_like);
  elements.humidity.textContent = `${data.main.humidity}%`;
  elements.wind.textContent = `${data.wind.speed} m/s`;
  elements.pressure.textContent = `${data.main.pressure} hPa`;

  elements.icon.src = getIconUrl(data.weather[0].icon);
  elements.icon.alt = data.weather[0].description;

  const timestamp = document.getElementById("last-updated");

    if (timestamp) {
        timestamp.textContent = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
    }
}

function renderForecast(data) {
  elements.forecast.replaceChildren();

  const dailyForecasts = new Map();

  for (const item of data.list) {
    const date = item.dt_txt.split(" ")[0];

    // Pick one forecast near midday for each day.
    const hour = Number(item.dt_txt.split(" ")[1].slice(0, 2));

    if (!dailyForecasts.has(date) ||
        Math.abs(hour - 12) <
        Math.abs(Number(dailyForecasts.get(date).dt_txt.split(" ")[1].slice(0, 2)) - 12)) {
      dailyForecasts.set(date, item);
    }
  }

  const days = [...dailyForecasts.values()].slice(0, 5);

  days.forEach((day) => {
    const card = document.createElement("article");
    card.className = "forecast-card";

    const date = new Date(`${day.dt_txt.slice(0, 10)}T12:00:00`);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    const title = document.createElement("p");
    title.className = "day";
    title.textContent = dayName;

    const icon = document.createElement("img");
    icon.src = getIconUrl(day.weather[0].icon);
    icon.alt = day.weather[0].description;
    icon.loading = "lazy";

    const condition = document.createElement("p");
    condition.className = "condition";
    condition.textContent = day.weather[0].description;

    const temperatures = document.createElement("p");
    temperatures.className = "temps";
    temperatures.textContent = `${Math.round(day.main.temp_max)}° / ${Math.round(day.main.temp_min)}°`;

    card.append(title, icon, condition, temperatures);
    elements.forecast.appendChild(card);
  });
}

function getIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

function updateBackground(condition) {
  const backgrounds = {
    Clear: "linear-gradient(135deg, #2463a6, #4b76b8, #172e48)",
    Clouds: "linear-gradient(135deg, #475569, #334155, #172033)",
    Rain: "linear-gradient(135deg, #1e3a5f, #334155, #10182f)",
    Drizzle: "linear-gradient(135deg, #1e3a5f, #334155, #10182f)",
    Thunderstorm: "linear-gradient(135deg, #312e81, #1e293b, #0f172a)",
    Snow: "linear-gradient(135deg, #64748b, #475569, #1e293b)",
    Mist: "linear-gradient(135deg, #64748b, #475569, #1e293b)",
    Fog: "linear-gradient(135deg, #64748b, #475569, #1e293b)"
  };

  document.body.style.background =
    backgrounds[condition] ||
    "linear-gradient(135deg, #10182f, #1d2450, #172e48)";

  document.body.style.backgroundAttachment = "fixed";
}

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = type;
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  cityInput.disabled = isLoading;
  loading.hidden = !isLoading;
  searchButton.textContent = isLoading ? "Loading..." : "Search";
}