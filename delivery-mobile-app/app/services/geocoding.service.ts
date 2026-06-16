import { ConnectivityService } from './connectivity.service';

export class GeocodingService {
    private connectivityService = new ConnectivityService();

    isOnline(): boolean {
        return this.connectivityService.isConnected();
    }

    async getSuggestions(query: string): Promise<string[]> {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=cr`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'DeliveryMobileApp/1.0' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.map((item: any) => item.display_name as string);
    }
}
