import { Http, ApplicationSettings } from '@nativescript/core';
import { API_CONFIG } from '../config/api.config';

export interface DeliveryDetail {
    id: number;
    status: string;
    origin: string;
    destination: string;
    driver: { id: number; name: string; phone: string; photoUrl: string | null; verified: boolean };
    client: { name: string; email: string; registeredSince: string };
}

export interface DriverItem {
    id: number;
    name: string;
    vehicle: string;
    plates: string;
    phone: string;
    photoUrl: string | null;
}

export interface AddressSuggestion {
    displayName: string;
}

export class EditDeliveryService {
    private getAuthHeaders(): Record<string, string> {
        const token = ApplicationSettings.getString('auth_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async getDelivery(id: number): Promise<DeliveryDetail> {
        const response = await Http.request({
            url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELIVERY_BY_ID(id)}`,
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error('Error al cargar la entrega. Intente nuevamente.');
        }

        return response.content.toJSON() as DeliveryDetail;
    }

    async getDrivers(): Promise<DriverItem[]> {
        const response = await Http.request({
            url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVERS}`,
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error('Error al cargar los repartidores. Intente nuevamente.');
        }

        return response.content.toJSON() as DriverItem[];
    }

    async updateDelivery(id: number, origin: string, destination: string, driverId: number): Promise<void> {
        const response = await Http.request({
            url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELIVERY_BY_ID(id)}`,
            method: 'PUT',
            headers: this.getAuthHeaders(),
            content: JSON.stringify({ origin, destination, driverId }),
        });

        if (response.statusCode < 200 || response.statusCode >= 300) {
            const raw = response.content?.toJSON?.() ?? null;
            throw new Error(raw?.error ?? 'Error al guardar los cambios. Intente nuevamente.');
        }
    }

    async searchAddress(query: string): Promise<AddressSuggestion[]> {
        const response = await Http.request({
            url: `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
            method: 'GET',
            headers: { 'User-Agent': 'GestionOrdenesApp/1.0' },
        });

        const raw = response.content?.toJSON?.() ?? [];
        return (raw as any[]).map(item => ({ displayName: item.display_name as string }));
    }
}
