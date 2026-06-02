import { Http, ApplicationSettings } from '@nativescript/core';
import { API_CONFIG } from '../config/api.config';
import { Delivery } from '../models/delivery.model';

export class DeliveryService {
    private getAuthHeaders(): Record<string, string> {
        const token = ApplicationSettings.getString('auth_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

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
}