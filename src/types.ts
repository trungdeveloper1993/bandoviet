export interface TravelLocation {
  id: string;
  name: string;
  region: string;
  image: string;
  lat: number;
  lng: number;
  visited: boolean;
  notes: string;
  plannedDate?: string;
  createdAt: string;
}

export type Region = 'Tất cả' | 'Miền Bắc' | 'Miền Trung' | 'Miền Nam' | 'Nước ngoài';

export interface UserSettings {
  darkMode: boolean;
  showMap: boolean;
  simulatedLat?: number;
  simulatedLng?: number;
  useLiveLocation: boolean;
}
