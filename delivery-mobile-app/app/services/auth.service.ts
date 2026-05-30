import { ApplicationSettings, Http } from '@nativescript/core';
import { API_CONFIG } from '../config/api.config';

export class AuthService {
    async login(email: string, password: string): Promise<string> {
        const response = await Http.request({
            url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            content: JSON.stringify({ email, password }),
        });

        const raw = response.content?.toJSON?.() ?? null;

        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error(raw?.error ?? 'Login failed.');
        }

        if (!raw?.token) {
            throw new Error('Invalid server response: missing token.');
        }

        return raw.token as string;
    }

    saveToken(token: string): void {
        ApplicationSettings.setString('auth_token', token);
    }

    getToken(): string | null {
        return ApplicationSettings.getString('auth_token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    logout(): void {
        ApplicationSettings.remove('auth_token');
    }
}
