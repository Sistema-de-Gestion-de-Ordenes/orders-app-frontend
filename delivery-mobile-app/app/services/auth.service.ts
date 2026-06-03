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

    getRole(): string | null {
        const token = this.getToken();
        if (!token) return null;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4 !== 0) base64 += '=';
            const decoded = this._base64Decode(base64);
            const payload = JSON.parse(decoded);
            return (
                payload['role'] ??
                payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
                null
            );
        } catch {
            return null;
        }
    }

    private _base64Decode(str: string): string {
        const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const clean = str.replace(/[^A-Za-z0-9+/]/g, '');
        let output = '';
        for (let i = 0; i < clean.length; i += 4) {
            const b0 = table.indexOf(clean[i]);
            const b1 = table.indexOf(clean[i + 1] ?? '');
            const b2 = table.indexOf(clean[i + 2] ?? '');
            const b3 = table.indexOf(clean[i + 3] ?? '');
            output += String.fromCharCode((b0 << 2) | (b1 >> 4));
            if (clean[i + 2] && clean[i + 2] !== '=') {
                output += String.fromCharCode(((b1 & 0xf) << 4) | (b2 >> 2));
            }
            if (clean[i + 3] && clean[i + 3] !== '=') {
                output += String.fromCharCode(((b2 & 0x3) << 6) | b3);
            }
        }
        return output;
    }
}
