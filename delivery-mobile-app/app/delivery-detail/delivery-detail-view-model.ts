import { Observable, Frame, Dialogs } from '@nativescript/core';
import { DeliveryService } from '../services/delivery.service';
import { AuthService } from '../services/auth.service';
import { DeliveryDetail } from '../models/delivery.model';

export class DeliveryDetailViewModel extends Observable {
    private _isLoading = true;
    private _hasError = false;
    private _errorMessage = '';
    private _isUpdatingStatus = false;
    private _isAdmin = false;

    private _title = '';
    private _statusLabel = '';
    private _statusColor = '#E0E0E0';
    private _statusTextColor = '#616161';
    private _deliveryIdLabel = '';
    private _currentStatus = '';

    private _clientName = '';
    private _clientEmail = '';
    private _clientRegisteredSince = '';

    private _driverName = '';
    private _driverPhone = '';
    private _driverPhotoUrl = '';
    private _driverVerified = false;

    private _origin = '';
    private _destination = '';

    private deliveryService = new DeliveryService();
    private deliveryId: number;

    constructor(deliveryId: number) {
        super();
        this.deliveryId = deliveryId;
        const paddedId = String(deliveryId).padStart(3, '0');
        this._title = `Entrega #${paddedId}`;
        this._deliveryIdLabel = `ID #${paddedId}`;
        this._isAdmin = new AuthService().isAdmin();
        this.loadDelivery();
    }

    // ── Getters / Setters ──────────────────────────────────────────────────────

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(v: boolean) { this._isLoading = v; this.notifyPropertyChange('isLoading', v); }

    get hasError(): boolean { return this._hasError; }
    set hasError(v: boolean) { this._hasError = v; this.notifyPropertyChange('hasError', v); }

    get errorMessage(): string { return this._errorMessage; }
    set errorMessage(v: string) { this._errorMessage = v; this.notifyPropertyChange('errorMessage', v); }

    get isUpdatingStatus(): boolean { return this._isUpdatingStatus; }
    set isUpdatingStatus(v: boolean) { this._isUpdatingStatus = v; this.notifyPropertyChange('isUpdatingStatus', v); }

    get isAdmin(): boolean { return this._isAdmin; }

    get title(): string { return this._title; }
    set title(v: string) { this._title = v; this.notifyPropertyChange('title', v); }

    get statusLabel(): string { return this._statusLabel; }
    set statusLabel(v: string) { this._statusLabel = v; this.notifyPropertyChange('statusLabel', v); }

    get statusColor(): string { return this._statusColor; }
    set statusColor(v: string) { this._statusColor = v; this.notifyPropertyChange('statusColor', v); }

    get statusTextColor(): string { return this._statusTextColor; }
    set statusTextColor(v: string) { this._statusTextColor = v; this.notifyPropertyChange('statusTextColor', v); }

    get deliveryIdLabel(): string { return this._deliveryIdLabel; }
    set deliveryIdLabel(v: string) { this._deliveryIdLabel = v; this.notifyPropertyChange('deliveryIdLabel', v); }

    get clientName(): string { return this._clientName; }
    set clientName(v: string) { this._clientName = v; this.notifyPropertyChange('clientName', v); }

    get clientEmail(): string { return this._clientEmail; }
    set clientEmail(v: string) { this._clientEmail = v; this.notifyPropertyChange('clientEmail', v); }

    get clientRegisteredSince(): string { return this._clientRegisteredSince; }
    set clientRegisteredSince(v: string) { this._clientRegisteredSince = v; this.notifyPropertyChange('clientRegisteredSince', v); }

    get driverName(): string { return this._driverName; }
    set driverName(v: string) { this._driverName = v; this.notifyPropertyChange('driverName', v); }

    get driverPhone(): string { return this._driverPhone; }
    set driverPhone(v: string) { this._driverPhone = v; this.notifyPropertyChange('driverPhone', v); }

    get driverPhotoUrl(): string { return this._driverPhotoUrl; }
    set driverPhotoUrl(v: string) { this._driverPhotoUrl = v; this.notifyPropertyChange('driverPhotoUrl', v); }

    get driverVerified(): boolean { return this._driverVerified; }
    set driverVerified(v: boolean) { this._driverVerified = v; this.notifyPropertyChange('driverVerified', v); }

    get origin(): string { return this._origin; }
    set origin(v: string) { this._origin = v; this.notifyPropertyChange('origin', v); }

    get destination(): string { return this._destination; }
    set destination(v: string) { this._destination = v; this.notifyPropertyChange('destination', v); }

    // ── Actions ────────────────────────────────────────────────────────────────

    async loadDelivery(): Promise<void> {
        this.isLoading = true;
        this.hasError = false;
        try {
            const data = await this.deliveryService.getDeliveryById(this.deliveryId);
            this.populateData(data);
        } catch (error: any) {
            this.hasError = true;
            this.errorMessage = error.message ?? 'Failed to load delivery.';
        } finally {
            this.isLoading = false;
        }
    }

    onRetryTap(): void {
        this.loadDelivery();
    }

    onBackTap(): void {
        Frame.topmost().goBack();
    }

    async onChangeStatusTap(): Promise<void> {
        const allOptions = [
            { label: 'Pendiente',   value: 'pending'    },
            { label: 'En tránsito', value: 'in_transit' },
            { label: 'Entregado',   value: 'delivered'  },
            { label: 'Cancelado',   value: 'cancelled'  },
        ];

        const validNext: Record<string, string[]> = {
            pending:    ['in_transit'],
            in_transit: ['delivered', 'cancelled'],
        };

        const allowed = validNext[this._currentStatus] ?? [];
        const options = allOptions.filter(o => allowed.includes(o.value));

        if (options.length === 0) {
            await Dialogs.alert({
                title: 'Sin cambios disponibles',
                message: 'Esta entrega no puede cambiar de estado.',
                okButtonText: 'Aceptar',
            });
            return;
        }

        const result = await Dialogs.action({
            title: 'Cambiar estado de entrega',
            cancelButtonText: 'Cancelar',
            actions: options.map(o => o.label),
        });

        if (!result || result === 'Cancelar') return;

        const selected = options.find(o => o.label === result);
        if (!selected || selected.value === this._currentStatus) return;

        this.isUpdatingStatus = true;
        try {
            await this.deliveryService.updateDeliveryStatus(this.deliveryId, selected.value);
            this._currentStatus = selected.value;
            const s = this.resolveStatus(selected.value);
            this.statusLabel     = s.label;
            this.statusColor     = s.bg;
            this.statusTextColor = s.text;
        } catch (e: any) {
            await Dialogs.alert({
                title: 'Error',
                message: e.message ?? 'No se pudo cambiar el estado.',
                okButtonText: 'Aceptar',
            });
        } finally {
            this.isUpdatingStatus = false;
        }
    }

    // ── Private ────────────────────────────────────────────────────────────────

    private populateData(data: DeliveryDetail): void {
        const paddedId = String(data.id).padStart(3, '0');
        this.title           = `Entrega #${paddedId}`;
        this.deliveryIdLabel = `ID #${paddedId}`;

        this._currentStatus  = data.status;
        const s = this.resolveStatus(data.status);
        this.statusLabel     = s.label;
        this.statusColor     = s.bg;
        this.statusTextColor = s.text;

        this.clientName            = data.client.name;
        this.clientEmail           = data.client.email;
        this.clientRegisteredSince = data.client.registeredSince;

        this.driverName     = data.driver.name;
        this.driverPhone    = data.driver.phone;
        this.driverPhotoUrl = data.driver.photoUrl ?? '';
        this.driverVerified = data.driver.verified;

        this.origin      = data.origin;
        this.destination = data.destination;
    }

    private resolveStatus(status: string): { label: string; bg: string; text: string } {
        const map: Record<string, { label: string; bg: string; text: string }> = {
            pending:    { label: 'Pendiente',   bg: '#E0E0E0', text: '#616161' },
            in_transit: { label: 'En tránsito', bg: '#BBDEFB', text: '#1565C0' },
            en_way:     { label: 'En tránsito', bg: '#BBDEFB', text: '#1565C0' },
            delivered:  { label: 'Entregado',   bg: '#C8E6C9', text: '#2E7D32' },
            canceled:   { label: 'Cancelado',   bg: '#FFCDD2', text: '#C62828' },
            cancelled:  { label: 'Cancelado',   bg: '#FFCDD2', text: '#C62828' },
        };
        return map[status] ?? { label: status, bg: '#E0E0E0', text: '#616161' };
    }
}
