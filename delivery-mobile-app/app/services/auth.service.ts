import { ApplicationSettings, Http } from '@nativescript/core';
import { API_CONFIG } from '../config/api.config';
import { FirebaseService } from './firebase.service';

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

    isAdmin(): boolean {
        const token = this.getToken();
        if (!token) return false;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const pad = (4 - (base64.length % 4)) % 4;
            const payload = JSON.parse(atob(base64 + '='.repeat(pad)));
            const role = payload?.role
                ?? payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            return role === 'admin';
        } catch {
            return false;
        }
    }

    logout(): void {
        new FirebaseService().unregisterCurrentToken().catch(() => {});
        ApplicationSettings.remove('auth_token');
    }
}
