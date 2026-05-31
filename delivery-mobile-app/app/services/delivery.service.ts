import { Http, ApplicationSettings } from '@nativescript/core';
import { API_CONFIG } from '../config/api.config';
import { Client, Driver, CreateDeliveryRequest, Delivery } from '../models/delivery.model';

export class DeliveryService {
    private getAuthHeaders(): Record<string, string> {
        const token = ApplicationSettings.getString('auth_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    // ── Deliveries ────────────────────────────────────────────────────────────

    async getDeliveries(): Promise<Delivery[]> {
        const response = await Http.request({
            url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELIVERIES}`,
            method: 'GET',
            headers: this.getAuthHeaders(),
        });
        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error('Failed to load deliveries. Please try again.');
        }
        return response.content.toJSON() as Delivery[];
    }

    async createDelivery(payload: CreateDeliveryRequest): Promise<void> {
        const response = await Http.request({
            url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELIVERIES}`,
            method: 'POST',
            headers: this.getAuthHeaders(),
            content: JSON.stringify(payload),
        });
        if (response.statusCode < 200 || response.statusCode >= 300) {
            const data = response.content.toJSON();
            throw new Error(data?.error ?? 'Failed to create delivery. Please try again.');
        }
    }

    // ── Clients — hardcoded until GET /clients is available ──────────────────

    async getClients(): Promise<Client[]> {
        // TODO: replace with real API call when GET /clients endpoint is ready
        // const response = await Http.request({
        //     url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENTS}`,
        //     method: 'GET',
        //     headers: this.getAuthHeaders(),
        // });
        // return response.content.toJSON() as Client[];

        return Promise.resolve([
            { id: 1, name: 'Cliente Test', email: 'test@test.com', phone: '88001111' },
            { id: 2, name: 'Admin',        email: 'admin@test.com', phone: '88002222' },
        ]);
    }

    // ── Drivers — hardcoded until GET /drivers is available ──────────────────

    async getDrivers(): Promise<Driver[]> {
        // TODO: replace with real API call when GET /drivers endpoint is ready
        // const response = await Http.request({
        //     url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVERS}`,
        //     method: 'GET',
        //     headers: this.getAuthHeaders(),
        // });
        // return response.content.toJSON() as Driver[];

        return Promise.resolve([
            { id: 1, name: 'Driver Test', vehicle: 'Toyota Corolla', plates: 'ABC123' },
        ]);
    }
}