import { ApplicationSettings, Http } from '@nativescript/core';
import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-messaging';
import { API_CONFIG } from '../config/api.config';

export class FirebaseService {
    private getAuthHeaders(): Record<string, string> {
        const token = ApplicationSettings.getString('auth_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async initializeAndRegister(): Promise<void> {
        await firebase().messaging().requestPermission();
        const token = await firebase().messaging().getToken();
        if (token) {
            await this.registerToken(token);
        }
        firebase().messaging().onToken(async (newToken: string) => {
            await this.registerToken(newToken).catch((e) =>
                console.error('FCM token refresh registration failed:', e)
            );
        });
    }

    async unregisterCurrentToken(): Promise<void> {
        const token = await firebase().messaging().getToken();
        if (!token) return;
        await Http.request({
            url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UNREGISTER_FCM_TOKEN}`,
            method: 'DELETE',
            headers: this.getAuthHeaders(),
            content: JSON.stringify({ deviceToken: token }),
        });
    }

    private async registerToken(fcmToken: string): Promise<void> {
        const response = await Http.request({
            url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER_FCM_TOKEN}`,
            method: 'POST',
            headers: this.getAuthHeaders(),
            content: JSON.stringify({ fcmToken }),
        });
        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error(`FCM token registration failed with status ${response.statusCode}`);
        }
    }
}
