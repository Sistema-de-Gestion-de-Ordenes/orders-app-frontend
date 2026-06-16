import { ApplicationSettings, Http } from '@nativescript/core';
import { API_CONFIG } from '../config/api.config';

declare const java: any; // NativeScript Android — available globally at runtime

export interface ClientData {
    name: string;
    email: string;
    password: string;
    phone: string;
    profilePhotoPath: string;
}

export class ClientService {
    async createClient(data: ClientData): Promise<void> {
        const url   = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREATE_CLIENT}`;
        const token = ApplicationSettings.getString('auth_token') ?? '';
        const boundary = `----FormBoundary${Date.now().toString(16)}`;
        const CRLF    = '\r\n';
        const encoder = new TextEncoder();
        const parts: Uint8Array[] = [];

        const addField = (name: string, value: string) => {
            parts.push(encoder.encode(
                `--${boundary}${CRLF}` +
                `Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}` +
                `${value}${CRLF}`
            ));
        };

        addField('Name',     data.name);
        addField('Email',    data.email);
        addField('Phone',    data.phone);
        addField('Password', data.password);

        // Read raw file bytes via Java I/O — avoids atob()/charCodeAt() encoding corruption
        const ext  = data.profilePhotoPath.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        const fis  = new java.io.FileInputStream(data.profilePhotoPath);
        const bos  = new java.io.ByteArrayOutputStream();
        const tmpBuf: any = (Array as any).create('byte', 4096);
        let nRead: number;
        while ((nRead = fis.read(tmpBuf)) !== -1) { bos.write(tmpBuf, 0, nRead); }
        fis.close();
        const rawBytes = bos.toByteArray();
        const imgBytes = new Uint8Array(rawBytes.length);
        for (let i = 0; i < rawBytes.length; i++) { imgBytes[i] = rawBytes[i] & 0xFF; }

        parts.push(encoder.encode(
            `--${boundary}${CRLF}` +
            `Content-Disposition: form-data; name="Photo"; filename="photo.${ext}"${CRLF}` +
            `Content-Type: ${mime}${CRLF}${CRLF}`
        ));
        parts.push(imgBytes);
        parts.push(encoder.encode(CRLF));
        parts.push(encoder.encode(`--${boundary}--${CRLF}`));

        // Combine all parts into a single ArrayBuffer
        const totalLength = parts.reduce((s, p) => s + p.length, 0);
        const body = new Uint8Array(totalLength);
        let offset = 0;
        for (const p of parts) { body.set(p, offset); offset += p.length; }

        const response = await Http.request({
            url,
            method:  'POST',
            headers: {
                'Content-Type':  `multipart/form-data; boundary=${boundary}`,
                'Authorization': `Bearer ${token}`,
            },
            content: body.buffer as any,
        });

        const raw = response.content?.toJSON?.() ?? null;

        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error(raw?.error ?? raw?.message ?? 'Error al crear el cliente.');
        }
    }
}
