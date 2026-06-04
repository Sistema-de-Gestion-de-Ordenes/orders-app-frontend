import { Http, ApplicationSettings } from '@nativescript/core';
import { API_CONFIG } from '../config/api.config';
import { Client, Driver, CreateDeliveryRequest, Delivery, DeliveryDetail } from '../models/delivery.model';

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

    async getDeliveryById(id: number): Promise<DeliveryDetail> {
        const response = await Http.request({
            url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELIVERIES}/${id}`,
            method: 'GET',
            headers: this.getAuthHeaders(),
        });
        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error('Failed to load delivery details. Please try again.');
        }
        return response.content.toJSON() as DeliveryDetail;
    }

    async deleteDelivery(id: number): Promise<void> {
        const response = await Http.request({
            url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELIVERIES}/${id}`,
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });
        if (response.statusCode !== 204) {
            const body = response.content?.toString?.() ?? '';
            let message = `Error ${response.statusCode}: No se pudo eliminar la entrega.`;
            try {
                const parsed = JSON.parse(body);
                if (parsed?.error) message = parsed.error;
            } catch {}
            throw new Error(message);
        }
    }

    async updateDeliveryStatus(id: number, status: string): Promise<void> {
        const response = await Http.request({
            url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELIVERIES}/${id}/status`,
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            content: JSON.stringify({ status }),
        });
        if (response.statusCode < 200 || response.statusCode >= 300) {
            const body = response.content?.toString?.() ?? '';
            console.error(`updateDeliveryStatus failed — status: ${response.statusCode}, body: ${body}`);
            let message = `Error ${response.statusCode}: No se pudo actualizar el estado.`;
            try {
                const parsed = JSON.parse(body);
                if (parsed?.message || parsed?.error) message = parsed.message ?? parsed.error;
            } catch {}
            throw new Error(message);
        }
    }

    async createDelivery(payload: CreateDeliveryRequest): Promise<void> {
        const response = await Http.request({
            url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELIVERIES}`,
            method: 'POST',
            headers: this.getAuthHeaders(),
            content: JSON.stringify(payload),
        });
        if (response.statusCode < 200 || response.statusCode >= 300) {
            const raw = response.content.toString().trim();
            let message = 'Failed to create delivery. Please try again.';
            if (raw) {
                try {
                    const data = JSON.parse(raw);
                    message = data?.error ?? message;
                } catch {}
            }
            throw new Error(message);
        }
    }

    // ── Clients ───────────────────────────────────────────────────────────────
    // TODO: when GET /clients is available, replace the
    //       return Promise.resolve([...]) block with the real call commented below.

    async getClients(): Promise<Client[]> {
        // ── REPLACE WHEN ENDPOINT IS AVAILABLE ───────────────────────────────
        // const response = await Http.request({
        //     url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENTS}`,
        //     method: 'GET',
        //     headers: this.getAuthHeaders(),
        // });
        // if (response.statusCode < 200 || response.statusCode >= 300) {
        //     throw new Error('Failed to load client list.');
        // }
        // return response.content.toJSON() as Client[];
        // ─────────────────────────────────────────────────────────────────────

        return Promise.resolve([
            { id: 1, name: 'Cliente Test', email: '', phone: '' },
            { id: 2, name: 'Admin',        email: '', phone: '' },
            { id: 3, name: 'Admin Yeye',   email: '', phone: '' },
        ]);
    }

    // ── Drivers ───────────────────────────────────────────────────────────────
    // TODO: when GET /drivers is available, replace the
    //       return Promise.resolve([...]) block with the real call commented below.

    async getDrivers(): Promise<Driver[]> {
        // ── REPLACE WHEN ENDPOINT IS AVAILABLE ───────────────────────────────
        // const response = await Http.request({
        //     url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVERS}`,
        //     method: 'GET',
        //     headers: this.getAuthHeaders(),
        // });
        // if (response.statusCode < 200 || response.statusCode >= 300) {
        //     throw new Error('Failed to load driver list.');
        // }
        // return response.content.toJSON() as Driver[];
        // ─────────────────────────────────────────────────────────────────────

        return Promise.resolve([
            { id: 1, name: 'Driver Test', vehicle: '', plates: '' },
        ]);
    }
}