/**
 * Weather Service for fetching weather risks based on coordinates.
 * Integrates with Open-Meteo API.
 */

export async function fetchWeatherRisk(latLng: string): Promise<string> {
  try {
    const [latStr, lngStr] = latLng.split(',').map((s) => s.trim());
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      console.warn(`Invalid site_location coordinates: ${latLng}. Defaulting to UNKNOWN.`);
      return 'UNKNOWN';
    }

    // Call Open-Meteo current weather API (temperature, windspeed, precipitation)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,precipitation&timezone=auto`;

    // Abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Open-Meteo API returned non-2xx status: ${response.status}`);
      return 'UNKNOWN'; // Fallback
    }

    const data = await response.json();
    const current = data.current;

    if (!current) {
      return 'UNKNOWN';
    }

    const windSpeed = current.wind_speed_10m || 0;
    const precipitation = current.precipitation || 0;
    const temp = current.temperature_2m;

    // Define rules for weather risk
    // e.g. severe if wind > 40 km/h or precipitation > 10mm or temp < -10 or temp > 45
    if (windSpeed > 40 || precipitation > 10 || temp < -10 || temp > 45) {
      return 'SEVERE';
    }

    // caution if wind > 20 km/h or precipitation > 2mm or temp < 0 or temp > 35
    if (windSpeed > 20 || precipitation > 2 || temp < 0 || temp > 35) {
      return 'CAUTION';
    }

    return 'NONE';
  } catch (error) {
    console.error('Weather API fetch failed:', error);
    // Graceful fallback behavior if API fails, times out, or network issue
    return 'UNKNOWN';
  }
}
