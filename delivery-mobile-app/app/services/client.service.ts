import { Http, ApplicationSettings, File } from '@nativescript/core';
import { API_CONFIG } from '../config/api.config';

export interface ClientData {
    name: string;
    email: string;
    password: string;
    phone: string;
    profilePhotoPath: string | null;
}

export class ClientService {
    async createClient(data: ClientData): Promise<void> {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREATE_CLIENT}`;
        const token = ApplicationSettings.getString('auth_token') ?? '';
        const boundary = `----FormBoundary${Date.now().toString(16)}`;
        const CRLF = '\r\n';

        const addTextField = (name: string, value: string): string =>
            `--${boundary}${CRLF}` +
            `Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}` +
            `${value}${CRLF}`;

        let body = '';
        body += addTextField('Name', data.name);
        body += addTextField('Email', data.email);
        body += addTextField('Phone', data.phone);
        body += addTextField('Password', data.password);

        if (data.profilePhotoPath) {
            const imageFile = File.fromPath(data.profilePhotoPath);
            const ext = data.profilePhotoPath.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
            const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
            const fileContent = imageFile.readTextSync();

            body +=
                `--${boundary}${CRLF}` +
                `Content-Disposition: form-data; name="Photo"; filename="photo.${ext}"${CRLF}` +
                `Content-Type: ${mime}${CRLF}${CRLF}` +
                `${fileContent}${CRLF}`;
        }

        body += `--${boundary}--${CRLF}`;

        const response = await Http.request({
            url,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Authorization': `Bearer ${token}`,
            },
            content: body,
        });

        const raw = response.content?.toJSON?.() ?? null;

        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error(raw?.error ?? raw?.message ?? 'Error al crear el cliente.');
        }
    }
}
