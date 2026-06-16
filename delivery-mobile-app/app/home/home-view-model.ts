import { Observable, ObservableArray, Frame, ImageSource } from '@nativescript/core';
import { DeliveryService } from '../services/delivery.service';
import { SqliteService } from '../services/sqlite.service';
import { ConnectivityService } from '../services/connectivity.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Delivery } from '../models/delivery.model';
import { API_CONFIG } from '../config/api.config';

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
    isAdmin: boolean;

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

    constructor(delivery: Delivery, isAdmin: boolean) {
        super();
        this.id          = delivery.id;
        this.client      = delivery.client;
        this.driver      = delivery.driver;
        this.origin      = delivery.origin;
        this.destination = delivery.destination;
        this.status      = delivery.status;
        this.route       = `${delivery.origin} → ${delivery.destination}`;
        this.isAdmin     = isAdmin;

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
                .catch(err => { console.error('Error cargando foto del cliente:', err); });
        }

        if (delivery.driverPhotoUrl) {
            ImageSource.fromUrl(`${API_CONFIG.BASE_URL}${delivery.driverPhotoUrl}`)
                .then(src => { this.driverPhoto = src; })
                .catch(err => { console.error('Error cargando foto del repartidor:', err); });
        }
    }

    onDetailTap(): void {
        Frame.topmost().navigate({
            moduleName: 'delivery-detail/delivery-detail-page',
            context: { deliveryId: this.id },
        });
    }

    onEditTap(): void {
        Frame.topmost().navigate({
            moduleName: 'edit-delivery/edit-delivery-page',
            context: { deliveryId: this.id },
        });
    }
}

export class HomeViewModel extends Observable {
    private _deliveries          = new ObservableArray<DeliveryItem>();
    private _allDeliveries       : DeliveryItem[] = [];
    private _isLoading: boolean  = false;
    private _hasError: boolean   = false;
    private _errorMessage        = '';
    private _isEmpty: boolean    = false;
    private _isOffline: boolean  = false;

    // Un booleano por chip — NativeScript no soporta comparaciones en bindings XML
    private _filterAll        = true;
    private _filterPending    = false;
    private _filterInTransit  = false;
    private _filterDelivered  = false;
    private _filterCanceled   = false;

    private _activeFilter = 'all';
    private _isAdmin: boolean = false;

    get isAdmin(): boolean { return this._isAdmin; }

    private deliveryService     = new DeliveryService();
    private sqliteService       = new SqliteService();
    private connectivityService = new ConnectivityService();
    private authService         = new AuthService();

    constructor() {
        super();
        this.init();
    }

    private async init(): Promise<void> {
        this._isAdmin = this.authService.getRole() === 'admin';
        await this.sqliteService.open();
        await this.loadDeliveries();
        new NotificationService().checkPendingNavigation();
    }

    // ── Getters / Setters ────────────────────────────────────────────────────

    get deliveries(): ObservableArray<DeliveryItem> { return this._deliveries; }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(value: boolean) { this._isLoading = value; this.notifyPropertyChange('isLoading', value); }

    get hasError(): boolean { return this._hasError; }
    set hasError(value: boolean) { this._hasError = value; this.notifyPropertyChange('hasError', value); }

    get errorMessage(): string { return this._errorMessage; }
    set errorMessage(value: string) { this._errorMessage = value; this.notifyPropertyChange('errorMessage', value); }

    get isEmpty(): boolean { return this._isEmpty; }
    set isEmpty(value: boolean) { this._isEmpty = value; this.notifyPropertyChange('isEmpty', value); }

    get isOffline(): boolean { return this._isOffline; }
    set isOffline(value: boolean) { this._isOffline = value; this.notifyPropertyChange('isOffline', value); }

    // Booleanos de filtro (usados en XML para background/color de chips)
    get filterAll():        boolean { return this._filterAll; }
    get filterPending():    boolean { return this._filterPending; }
    get filterInTransit():  boolean { return this._filterInTransit; }
    get filterDelivered():  boolean { return this._filterDelivered; }
    get filterCanceled():   boolean { return this._filterCanceled; }

    // ── Load ─────────────────────────────────────────────────────────────────

    async loadDeliveries(): Promise<void> {
        this.isLoading = true;
        this.hasError  = false;
        this.isEmpty   = false;
        this._deliveries.splice(0, this._deliveries.length);

        if (this.connectivityService.isConnected()) {
            this.isOffline = false;
            try {
                const data = await this.deliveryService.getDeliveries();
                await this.sqliteService.saveDeliveries(data);
                this.setDeliveries(data);
            } catch (error: any) {
                const local = await this.sqliteService.getDeliveries();
                if (local.length > 0) {
                    this.isOffline = true;
                    this.setDeliveries(local);
                } else {
                    this.hasError     = true;
                    this.errorMessage = error.message ?? 'Error al cargar las entregas.';
                }
            }
        } else {
            this.isOffline = true;
            const local = await this.sqliteService.getDeliveries();
            this.setDeliveries(local);
        }

        this.isLoading = false;
    }

    private setDeliveries(deliveries: Delivery[]): void {
        this._allDeliveries = deliveries.map(d => new DeliveryItem(d, this._isAdmin));
        this.applyFilter();
    }

    // ── Filter ───────────────────────────────────────────────────────────────

    private setActiveFilter(key: string): void {
        this._activeFilter      = key;
        this._filterAll         = key === 'all';
        this._filterPending     = key === 'pending';
        this._filterInTransit   = key === 'in_transit';
        this._filterDelivered   = key === 'delivered';
        this._filterCanceled    = key === 'canceled';

        // Notifica todos los booleanos para que el XML actualice los chips
        this.notifyPropertyChange('filterAll',       this._filterAll);
        this.notifyPropertyChange('filterPending',   this._filterPending);
        this.notifyPropertyChange('filterInTransit', this._filterInTransit);
        this.notifyPropertyChange('filterDelivered', this._filterDelivered);
        this.notifyPropertyChange('filterCanceled',  this._filterCanceled);
    }

    private applyFilter(): void {
        this._deliveries.splice(0, this._deliveries.length);

        const filtered = this._activeFilter === 'all'
            ? this._allDeliveries
            : this._allDeliveries.filter(d => {
                if (this._activeFilter === 'in_transit') {
                    return d.status === 'in_transit' || d.status === 'en_way';
                }
                if (this._activeFilter === 'canceled') {
                    return d.status === 'canceled' || d.status === 'cancelled';
                }
                return d.status === this._activeFilter;
            });

        filtered.forEach(d => this._deliveries.push(d));
        this.isEmpty = this._deliveries.length === 0;
    }

    // Cada chip tiene su propio handler — evita depender del texto del Label
    onFilterAll():       void { this.setActiveFilter('all');        this.applyFilter(); }
    onFilterPending():   void { this.setActiveFilter('pending');    this.applyFilter(); }
    onFilterInTransit(): void { this.setActiveFilter('in_transit'); this.applyFilter(); }
    onFilterDelivered(): void { this.setActiveFilter('delivered');  this.applyFilter(); }
    onFilterCanceled():  void { this.setActiveFilter('canceled');   this.applyFilter(); }

    // ── Other handlers ───────────────────────────────────────────────────────

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
        Frame.topmost().navigate({ moduleName: 'delivery-create/delivery-create-page' });
    }
}