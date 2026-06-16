import { Observable, ObservableArray, Frame, ImageSource } from '@nativescript/core';
import { DeliveryService } from '../services/delivery.service';
import { DeliveryHistory } from '../models/delivery.model';
import { API_CONFIG } from '../config/api.config';

export class DeliveryHistoryItem extends Observable {
    id: number;
    client: string;
    driver: string;
    origin: string;
    destination: string;
    status: string;
    statusLabel: string;
    statusColor: string;
    statusTextColor: string;

    private _clientPhoto: ImageSource | null = null;
    private _driverPhoto: ImageSource | null = null;
    private _hasClientPhoto = false;
    private _hasDriverPhoto = false;

    get clientPhoto(): ImageSource | null { return this._clientPhoto; }
    set clientPhoto(v: ImageSource | null) {
        this._clientPhoto = v;
        this._hasClientPhoto = v !== null;
        this.notifyPropertyChange('clientPhoto', v);
        this.notifyPropertyChange('hasClientPhoto', this._hasClientPhoto);
    }

    get driverPhoto(): ImageSource | null { return this._driverPhoto; }
    set driverPhoto(v: ImageSource | null) {
        this._driverPhoto = v;
        this._hasDriverPhoto = v !== null;
        this.notifyPropertyChange('driverPhoto', v);
        this.notifyPropertyChange('hasDriverPhoto', this._hasDriverPhoto);
    }

    get hasClientPhoto(): boolean { return this._hasClientPhoto; }
    get hasDriverPhoto(): boolean { return this._hasDriverPhoto; }

    constructor(delivery: DeliveryHistory) {
        super();
        this.id          = delivery.id;
        this.client      = delivery.client;
        this.driver      = delivery.driver;
        this.origin      = delivery.origin;
        this.destination = delivery.destination;
        this.status      = delivery.status;

        const statusMap: Record<string, { label: string; bg: string; text: string }> = {
            pending:    { label: 'Pendiente',   bg: '#E0E0E0', text: '#616161' },
            en_way:     { label: 'En tránsito', bg: '#BBDEFB', text: '#1565C0' },
            in_transit: { label: 'En tránsito', bg: '#BBDEFB', text: '#1565C0' },
            delivered:  { label: 'Entregado',   bg: '#C8E6C9', text: '#2E7D32' },
            canceled:   { label: 'Cancelado',   bg: '#FFCDD2', text: '#C62828' },
            cancelled:  { label: 'Cancelado',   bg: '#FFCDD2', text: '#C62828' },
        };

        const mapped         = statusMap[delivery.status] ?? { label: delivery.status, bg: '#E0E0E0', text: '#616161' };
        this.statusLabel     = mapped.label;
        this.statusColor     = mapped.bg;
        this.statusTextColor = mapped.text;

        if (delivery.clientPhotoUrl) {
            ImageSource.fromUrl(`${API_CONFIG.BASE_URL}${delivery.clientPhotoUrl}`)
                .then(src => { this.clientPhoto = src; })
                .catch(() => {});
        }

        if (delivery.driverPhotoUrl) {
            ImageSource.fromUrl(`${API_CONFIG.BASE_URL}${delivery.driverPhotoUrl}`)
                .then(src => { this.driverPhoto = src; })
                .catch(() => {});
        }
    }

    onDetailTap(): void {
        Frame.topmost().navigate({
            moduleName: 'delivery-detail/delivery-detail-page',
            context: { deliveryId: this.id, fromHistory: true },
        });
    }
}

export class DeliveryHistoryViewModel extends Observable {
    private _deliveries          = new ObservableArray<DeliveryHistoryItem>();
    private _isLoading: boolean  = false;
    private _hasError: boolean   = false;
    private _errorMessage        = '';
    private _isEmpty: boolean    = false;

    private deliveryService = new DeliveryService();

    constructor() {
        super();
        this.loadHistory();
    }

    get deliveries(): ObservableArray<DeliveryHistoryItem> { return this._deliveries; }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(value: boolean) { this._isLoading = value; this.notifyPropertyChange('isLoading', value); }

    get hasError(): boolean { return this._hasError; }
    set hasError(value: boolean) { this._hasError = value; this.notifyPropertyChange('hasError', value); }

    get errorMessage(): string { return this._errorMessage; }
    set errorMessage(value: string) { this._errorMessage = value; this.notifyPropertyChange('errorMessage', value); }

    get isEmpty(): boolean { return this._isEmpty; }
    set isEmpty(value: boolean) { this._isEmpty = value; this.notifyPropertyChange('isEmpty', value); }

    async loadHistory(): Promise<void> {
        this.isLoading = true;
        this.hasError  = false;
        this.isEmpty   = false;
        this._deliveries.splice(0, this._deliveries.length);

        try {
            const data = await this.deliveryService.getDeliveryHistory();
            data.forEach(d => this._deliveries.push(new DeliveryHistoryItem(d)));
            this.isEmpty = this._deliveries.length === 0;
        } catch (error: any) {
            this.hasError     = true;
            this.errorMessage = error.message ?? 'Error al cargar el historial.';
        }

        this.isLoading = false;
    }

    onRetryTap(): void {
        this.loadHistory();
    }
}
