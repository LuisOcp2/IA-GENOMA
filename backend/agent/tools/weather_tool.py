"""Tool del clima usando Open-Meteo (100% gratuito, sin API key)"""

import httpx
from langchain.tools import tool

# Coordenadas de Cali, Colombia por defecto
DEFAULT_LAT = 3.4516
DEFAULT_LON = -76.5320
DEFAULT_CITY = "Cali"


@tool
def get_weather_tool(city: str = "Cali") -> str:
    """Obtiene el clima actual y pronóstico. Gratuito, sin API key.
    Args:
        city: Ciudad a consultar (default: Cali, Colombia)
    """
    try:
        # Geocoding primero para obtener coordenadas
        coords = {"Cali": (3.4516, -76.5320), "Bogotá": (4.7110, -74.0721),
                  "Medellín": (6.2442, -75.5812), "Barranquilla": (10.9685, -74.7813)}

        lat, lon = coords.get(city, (DEFAULT_LAT, DEFAULT_LON))

        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
            f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum"
            f"&timezone=America/Bogota&forecast_days=3"
        )

        with httpx.Client(timeout=10) as client:
            r = client.get(url)
            data = r.json()

        current = data["current"]
        daily = data["daily"]

        wmo_codes = {
            0: "☀️ Despejado", 1: "🌤️ Mayormente despejado", 2: "⛅ Parcialmente nublado",
            3: "☁️ Nublado", 45: "🌫️ Neblina", 51: "🌦️ Llovizna leve",
            61: "🌧️ Lluvia leve", 63: "🌧️ Lluvia moderada", 65: "🌧️ Lluvia intensa",
            80: "🌦️ Chubascos", 95: "⛈️ Tormenta"
        }
        condition = wmo_codes.get(current["weather_code"], "🌡️ Desconocido")

        result = (
            f"🌍 Clima en {city} ahora:\n"
            f"{condition}\n"
            f"🌡️ Temperatura: {current['temperature_2m']}°C\n"
            f"💧 Humedad: {current['relative_humidity_2m']}%\n"
            f"💨 Viento: {current['wind_speed_10m']} km/h\n\n"
            f"📅 Próximos 3 días:\n"
        )

        for i in range(3):
            result += (
                f"  {daily['time'][i]}: "
                f"↑{daily['temperature_2m_max'][i]}°C "
                f"↓{daily['temperature_2m_min'][i]}°C "
                f"🌧️{daily['precipitation_sum'][i]}mm\n"
            )

        return result
    except Exception as e:
        return f"Error obteniendo clima: {str(e)}"
