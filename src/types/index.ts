export type SubscriptionStatus = "free" | "premium";

export type UserProfile = {
  id: string;
  email: string;
  subscription_status: SubscriptionStatus;
  subscription_start: string | null;
  subscription_end: string | null;
  is_blocked: boolean;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
};

export type NBRBRate = {
  Cur_ID: number;
  Date: string;
  Cur_Abbreviation: string;
  Cur_Scale: number;
  Cur_Name: string;
  Cur_OfficialRate: number;
};

export type OpenWeatherCurrent = {
  main: { temp: number; feels_like: number; humidity: number; pressure: number };
  wind: { speed: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  name: string;
};

export type OpenWeatherForecastItem = {
  dt: number;
  main: { temp: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  dt_txt: string;
};

export type HourlyForecastItem = {
  dt: number;
  time: string;
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  weather: { id: number; main: string; description: string; icon: string };
};

export type OpenWeatherForecast = {
  list: OpenWeatherForecastItem[];
  city: { name: string };
};
