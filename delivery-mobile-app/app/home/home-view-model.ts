import { Observable, ObservableArray, Frame } from '@nativescript/core';
import { DeliveryService } from '../services/delivery.service';
import { Delivery } from '../models/delivery.model';

export class DeliveryItem extends Observable {
    id: number;
    client: string;
    driver: string;
    origin: string;
    destination: string;
    status: string;
    statusLabel: string;
    statusColor: string;
    statusTextColor: string;
    route: string;

    constructor(delivery: Delivery) {
        super();
        this.id = delivery.id;
        this.client = delivery.client;
        this.driver = delivery.driver;
        this.origin = delivery.origin;
        this.destination = delivery.destination;
        this.status = delivery.status;
        this.route = `${delivery.origin} → ${delivery.destination}`;

        const statusMap: Record<string, { label: string; bg: string; text: string }> = {
            pending:   { label: 'Pending',   bg: '#E0E0E0', text: '#616161' },
            en_way:    { label: 'On the way', bg: '#BBDEFB', text: '#1565C0' },
            delivered: { label: 'Delivered', bg: '#C8E6C9', text: '#2E7D32' },
            canceled:  { label: 'Canceled',  bg: '#FFCDD2', text: '#C62828' },
        };

        const mapped = statusMap[delivery.status] ?? { label: delivery.status, bg: '#E0E0E0', text: '#616161' };
        this.statusLabel     = mapped.label;
        this.statusColor     = mapped.bg;
        this.statusTextColor = mapped.text;
    }
}

export class HomeViewModel extends Observable {
    private _deliveries = new ObservableArray<DeliveryItem>();
    private _isLoading: boolean = false;
    private _hasError: boolean = false;
    private _errorMessage: string = '';
    private _isEmpty: boolean = false;
    private deliveryService = new DeliveryService();

    constructor() {
        super();
        this.loadDeliveries();
    }

    get deliveries(): ObservableArray<DeliveryItem> { return this._deliveries; }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(value: boolean) {
        this._isLoading = value;
        this.notifyPropertyChange('isLoading', value);
    }

    get hasError(): boolean { return this._hasError; }
    set hasError(value: boolean) {
        this._hasError = value;
        this.notifyPropertyChange('hasError', value);
    }

    get errorMessage(): string { return this._errorMessage; }
    set errorMessage(value: string) {
        this._errorMessage = value;
        this.notifyPropertyChange('errorMessage', value);
    }

    get isEmpty(): boolean { return this._isEmpty; }
    set isEmpty(value: boolean) {
        this._isEmpty = value;
        this.notifyPropertyChange('isEmpty', value);
    }

    async loadDeliveries(): Promise<void> {
        this.isLoading = true;
        this.hasError = false;
        this.isEmpty = false;
        this._deliveries.splice(0, this._deliveries.length);

        try {
            const data = await this.deliveryService.getDeliveries();
            if (data.length === 0) {
                this.isEmpty = true;
            } else {
                data.forEach(d => this._deliveries.push(new DeliveryItem(d)));
            }
        } catch (error: any) {
            this.hasError = true;
            this.errorMessage = error.message ?? 'Unexpected error. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    onRetryTap(): void {
        this.loadDeliveries();
    }

    onDeliveryTap(args: any): void {
        const delivery = this._deliveries.getItem(args.index);
        Frame.topmost().navigate({
            moduleName: 'delivery-detail/delivery-detail-page',
            context: { deliveryId: delivery.id },
        });
    }

    onAddTap(): void {
        Frame.topmost().navigate({
            moduleName: 'delivery-create/delivery-create-page',
        });
    }
}