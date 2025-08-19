interface WeatherData {
  temperature: number;
  condition: 'hot' | 'cold' | 'rainy' | 'sunny' | 'windy' | 'cloudy';
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  city: string;
  country: string;
}

interface WeatherAPIResponse {
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    humidity: number;
    wind_kph: number;
  };
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
}

class WeatherService {
  private readonly API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  private readonly BASE_URL = 'http://api.weatherapi.com/v1';
  private cache = new Map<string, { data: WeatherData; timestamp: number }>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  private mapConditionToCategory(condition: string, temp: number): WeatherData['condition'] {
    const lowerCondition = condition.toLowerCase();
    
    if (temp >= 25) return 'hot';
    if (temp <= 5) return 'cold';
    
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('shower')) {
      return 'rainy';
    }
    
    if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
      return 'sunny';
    }
    
    if (lowerCondition.includes('wind')) {
      return 'windy';
    }
    
    // Conditions par défaut selon température
    if (temp >= 20) return 'sunny';
    if (temp <= 10) return 'cold';
    
    return 'cloudy' as any; // fallback
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    const cacheKey = `${latitude},${longitude}`;
    const cached = this.cache.get(cacheKey);
    
    // Vérifier le cache
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/current.json?key=${this.API_KEY}&q=${latitude},${longitude}&aqi=no`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data: WeatherAPIResponse = await response.json();
      
      const weatherData: WeatherData = {
        temperature: data.current.temp_c,
        condition: this.mapConditionToCategory(data.current.condition.text, data.current.temp_c),
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        description: data.current.condition.text,
        icon: data.current.condition.icon,
        city: data.location.name,
        country: data.location.country
      };

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return weatherData;
      
    } catch (error) {
      console.error('Error fetching weather data:', error);
      
      // Retourner des données par défaut en cas d'erreur
      return {
        temperature: 20,
        condition: 'sunny',
        humidity: 50,
        windSpeed: 10,
        description: 'Données météo indisponibles',
        icon: '',
        city: 'Inconnu',
        country: 'Inconnu'
      };
    }
  }

  async getWeatherByCity(city: string): Promise<WeatherData> {
    const cacheKey = city;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/current.json?key=${this.API_KEY}&q=${encodeURIComponent(city)}&aqi=no`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data: WeatherAPIResponse = await response.json();
      
      const weatherData: WeatherData = {
        temperature: data.current.temp_c,
        condition: this.mapConditionToCategory(data.current.condition.text, data.current.temp_c),
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        description: data.current.condition.text,
        icon: data.current.condition.icon,
        city: data.location.name,
        country: data.location.country
      };

      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return weatherData;
      
    } catch (error) {
      console.error('Error fetching weather data for city:', error);
      throw error;
    }
  }

  // Méthode pour obtenir des recommandations produits basées sur la météo
  getWeatherBasedRecommendations(weather: WeatherData, triggers: any[]): string[] {
    const activeRecommendations: string[] = [];
    
    for (const trigger of triggers) {
      let shouldTrigger = false;
      
      switch (trigger.condition) {
        case 'hot':
          shouldTrigger = weather.temperature >= (trigger.threshold || 25);
          break;
        case 'cold':
          shouldTrigger = weather.temperature <= (trigger.threshold || 10);
          break;
        case 'rainy':
          shouldTrigger = weather.condition === 'rainy';
          break;
        case 'sunny':
          shouldTrigger = weather.condition === 'sunny';
          break;
        case 'windy':
          shouldTrigger = weather.windSpeed >= (trigger.threshold || 20);
          break;
        default:
          shouldTrigger = weather.condition === trigger.condition;
      }
      
      if (shouldTrigger) {
        activeRecommendations.push(...trigger.products);
      }
    }
    
    return [...new Set(activeRecommendations)]; // Supprimer les doublons
  }

  // Nettoyer le cache manuellement
  clearCache(): void {
    this.cache.clear();
  }

  // Obtenir les statistiques du cache
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const weatherService = new WeatherService();
export type { WeatherData };