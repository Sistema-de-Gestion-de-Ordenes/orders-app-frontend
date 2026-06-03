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
        // Decode and cache the role once at login so getRole() never needs to parse JWT again
        try {
            const role = this._extractRoleFromToken(token);
            if (role) ApplicationSettings.setString('auth_role', role);
        } catch {}
    }

    getToken(): string | null {
        return ApplicationSettings.getString('auth_token');
    }

    getRole(): string | null {
        return ApplicationSettings.getString('auth_role') ?? null;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    logout(): void {
        ApplicationSettings.remove('auth_token');
        ApplicationSettings.remove('auth_role');
    }

    private _extractRoleFromToken(token: string): string | null {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        // base64url → base64 with padding
        let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4 !== 0) b64 += '=';

        // decode base64 → binary bytes → UTF-8 string (handles accented chars in name/email)
        const binary = this._base64Decode(b64);
        const json = decodeURIComponent(
            binary.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );

        const payload = JSON.parse(json);

        // JwtSecurityTokenHandler maps ClaimTypes.Role to "role" by default,
        // but we also check the full URI in case the mapping was cleared
        return (
            payload['role'] ??
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
            null
        );
    }

    private _base64Decode(str: string): string {
        const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const clean = str.replace(/[^A-Za-z0-9+/=]/g, '');
        let output = '';
        for (let i = 0; i < clean.length; i += 4) {
            const c0 = clean[i]     || '';
            const c1 = clean[i + 1] || '';
            const c2 = clean[i + 2] || '=';
            const c3 = clean[i + 3] || '=';
            const b0 = table.indexOf(c0);
            const b1 = table.indexOf(c1);
            const b2 = table.indexOf(c2);
            const b3 = table.indexOf(c3);
            output += String.fromCharCode((b0 << 2) | (b1 >> 4));
            if (c2 !== '=') output += String.fromCharCode(((b1 & 0xf) << 4) | (b2 >> 2));
            if (c3 !== '=') output += String.fromCharCode(((b2 & 0x3) << 6) | b3);
        }
        return output;
    }
}
