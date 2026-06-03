import { Observable, ObservableArray, Frame } from '@nativescript/core';
import { EditDeliveryService, AddressSuggestion } from './edit-delivery.service';
import { GeocodingService } from '../services/geocoding.service';

type DriverListItem = { id: number; name: string; vehicle: string; initial: string };

export class EditDeliveryViewModel extends Observable {
    private readonly _service = new EditDeliveryService();
    private readonly _geocodingService = new GeocodingService();
    private readonly _deliveryId: number;

    private _isLoadingData = true;
    private _loadError = '';
    private _isLoading = false;
    private _errorMessage = '';
    private _showSuccess = false;

    private _origin = '';
    private _destination = '';
    private _currentDriverId = 0;
    private _currentDriverName = '';
    private _currentDriverPhone = '';
    private _selectedDriverId = 0;
    private _selectedDriverLabel = 'Buscar otro repartidor...';
    private _showDriverList = false;

    private _showOriginSuggestions = false;
    private _showDestinationSuggestions = false;
    private _isLoadingOriginSuggestions = false;
    private _isLoadingDestinationSuggestions = false;
    private _showOriginOffline = false;
    private _showDestinationOffline = false;
    private _originTimer: any = null;
    private _destTimer: any = null;

    readonly drivers = new ObservableArray<DriverListItem>();
    readonly originSuggestions = new ObservableArray<AddressSuggestion>();
    readonly destinationSuggestions = new ObservableArray<AddressSuggestion>();

    constructor(deliveryId: number) {
        super();
        this._deliveryId = deliveryId;
        this._loadData();
    }

    // ── Computed ──────────────────────────────────────────────────────────────

    get pageTitle(): string { return `Editar entrega #${String(this._deliveryId).padStart(3, '0')}`; }
    get isLoadingData(): boolean { return this._isLoadingData; }
    get loadError(): string { return this._loadError; }
    get hasLoadError(): boolean { return this._loadError !== ''; }
    get isFormVisible(): boolean { return !this._isLoadingData && !this.hasLoadError; }
    get isLoading(): boolean { return this._isLoading; }
    get errorMessage(): string { return this._errorMessage; }
    get hasError(): boolean { return this._errorMessage !== ''; }
    get showSuccess(): boolean { return this._showSuccess; }
    get currentDriverName(): string { return this._currentDriverName; }
    get currentDriverPhone(): string { return this._currentDriverPhone; }
    get selectedDriverLabel(): string { return this._selectedDriverLabel; }
    get showDriverList(): boolean { return this._showDriverList; }
    get showOriginSuggestions(): boolean { return this._showOriginSuggestions; }
    get showDestinationSuggestions(): boolean { return this._showDestinationSuggestions; }
    get isLoadingOriginSuggestions(): boolean { return this._isLoadingOriginSuggestions; }
    get isLoadingDestinationSuggestions(): boolean { return this._isLoadingDestinationSuggestions; }
    get showOriginOffline(): boolean { return this._showOriginOffline; }
    get showDestinationOffline(): boolean { return this._showDestinationOffline; }
    get originListHeight(): number { return this.originSuggestions.length * 52; }
    get destinationListHeight(): number { return this.destinationSuggestions.length * 52; }
    get driverListHeight(): number { return Math.min(this.drivers.length * 64, 256); }

    get origin(): string { return this._origin; }
    set origin(value: string) {
        if (this._origin === value) return;
        this._origin = value;
        this.notifyPropertyChange('origin', value);
        this._scheduleSearch('origin', value);
    }

    get destination(): string { return this._destination; }
    set destination(value: string) {
        if (this._destination === value) return;
        this._destination = value;
        this.notifyPropertyChange('destination', value);
        this._scheduleSearch('destination', value);
    }

    // ── Data load ─────────────────────────────────────────────────────────────

    private async _loadData(): Promise<void> {
        this._isLoadingData = true;
        this._loadError = '';
        this.notifyPropertyChange('isLoadingData', true);
        this.notifyPropertyChange('isFormVisible', false);
        this.notifyPropertyChange('hasLoadError', false);

        try {
            const [delivery, driverList] = await Promise.all([
                this._service.getDelivery(this._deliveryId),
                this._service.getDrivers(),
            ]);

            this._origin = delivery.origin;
            this._destination = delivery.destination;
            this._currentDriverId = delivery.driver.id;
            this._selectedDriverId = delivery.driver.id;
            this._currentDriverName = delivery.driver.name;
            this._currentDriverPhone = delivery.driver.phone;

            this.notifyPropertyChange('origin', this._origin);
            this.notifyPropertyChange('destination', this._destination);
            this.notifyPropertyChange('currentDriverName', this._currentDriverName);
            this.notifyPropertyChange('currentDriverPhone', this._currentDriverPhone);

            this.drivers.splice(0, this.drivers.length);
            driverList
                .filter(d => d.id !== this._currentDriverId)
                .forEach(d => this.drivers.push({
                    id: d.id,
                    name: d.name,
                    vehicle: d.vehicle,
                    initial: d.name.charAt(0).toUpperCase(),
                }));
            this.notifyPropertyChange('driverListHeight', this.driverListHeight);

        } catch (e: any) {
            this._loadError = e.message ?? 'Error al cargar los datos. Intente nuevamente.';
            this.notifyPropertyChange('loadError', this._loadError);
            this.notifyPropertyChange('hasLoadError', true);
        } finally {
            this._isLoadingData = false;
            this.notifyPropertyChange('isLoadingData', false);
            this.notifyPropertyChange('isFormVisible', this.isFormVisible);
        }
    }

    onRetry(): void { this._loadData(); }

    // ── Address autocomplete ─────────────────────────────────────────────────

    private _scheduleSearch(field: 'origin' | 'destination', text: string): void {
        const isOrigin = field === 'origin';
        clearTimeout(isOrigin ? this._originTimer : this._destTimer);
        this._hideSuggestions(field);

        // Reset loading/offline al escribir
        if (isOrigin) {
            this._isLoadingOriginSuggestions = false;
            this.notifyPropertyChange('isLoadingOriginSuggestions', false);
            this._showOriginOffline = false;
            this.notifyPropertyChange('showOriginOffline', false);
        } else {
            this._isLoadingDestinationSuggestions = false;
            this.notifyPropertyChange('isLoadingDestinationSuggestions', false);
            this._showDestinationOffline = false;
            this.notifyPropertyChange('showDestinationOffline', false);
        }

        if (text.length < 3) return;

        // Sin conexión: mostrar mensaje inmediatamente, no llamar a la API
        if (!this._geocodingService.isOnline()) {
            if (isOrigin) {
                this._showOriginOffline = true;
                this.notifyPropertyChange('showOriginOffline', true);
            } else {
                this._showDestinationOffline = true;
                this.notifyPropertyChange('showDestinationOffline', true);
            }
            return;
        }

        const timer = setTimeout(() => this._fetchSuggestions(field, text), 500);
        if (isOrigin) this._originTimer = timer; else this._destTimer = timer;
    }

    private async _fetchSuggestions(field: 'origin' | 'destination', query: string): Promise<void> {
        const isOrigin = field === 'origin';

        if (isOrigin) {
            this._isLoadingOriginSuggestions = true;
            this.notifyPropertyChange('isLoadingOriginSuggestions', true);
        } else {
            this._isLoadingDestinationSuggestions = true;
            this.notifyPropertyChange('isLoadingDestinationSuggestions', true);
        }

        try {
            const results = await this._geocodingService.getSuggestions(query);
            const current = isOrigin ? this._origin : this._destination;
            if (current !== query || results.length === 0) return;
            const arr = isOrigin ? this.originSuggestions : this.destinationSuggestions;
            arr.splice(0, arr.length);
            results.forEach(r => arr.push({ displayName: r }));
            if (isOrigin) {
                this._showOriginSuggestions = true;
                this.notifyPropertyChange('showOriginSuggestions', true);
                this.notifyPropertyChange('originListHeight', this.originListHeight);
            } else {
                this._showDestinationSuggestions = true;
                this.notifyPropertyChange('showDestinationSuggestions', true);
                this.notifyPropertyChange('destinationListHeight', this.destinationListHeight);
            }
        } catch { /* sugerencias fallan silenciosamente */ }
        finally {
            if (isOrigin) {
                this._isLoadingOriginSuggestions = false;
                this.notifyPropertyChange('isLoadingOriginSuggestions', false);
            } else {
                this._isLoadingDestinationSuggestions = false;
                this.notifyPropertyChange('isLoadingDestinationSuggestions', false);
            }
        }
    }

    private _hideSuggestions(field: 'origin' | 'destination'): void {
        if (field === 'origin') {
            this.originSuggestions.splice(0, this.originSuggestions.length);
            this._showOriginSuggestions = false;
            this.notifyPropertyChange('showOriginSuggestions', false);
        } else {
            this.destinationSuggestions.splice(0, this.destinationSuggestions.length);
            this._showDestinationSuggestions = false;
            this.notifyPropertyChange('showDestinationSuggestions', false);
        }
    }

    onOriginSuggestionTap(args: any): void {
        const item = this.originSuggestions.getItem(args.index) as AddressSuggestion;
        this._hideSuggestions('origin');
        this._origin = item.displayName;
        this.notifyPropertyChange('origin', this._origin);
    }

    onDestinationSuggestionTap(args: any): void {
        const item = this.destinationSuggestions.getItem(args.index) as AddressSuggestion;
        this._hideSuggestions('destination');
        this._destination = item.displayName;
        this.notifyPropertyChange('destination', this._destination);
    }

    // ── Driver dropdown ──────────────────────────────────────────────────────

    onToggleDriverList(): void {
        this._showDriverList = !this._showDriverList;
        this.notifyPropertyChange('showDriverList', this._showDriverList);
    }

    onDriverTap(args: any): void {
        const driver = this.drivers.getItem(args.index) as DriverListItem;
        this._selectedDriverId = driver.id;
        this._selectedDriverLabel = driver.name;
        this._showDriverList = false;
        this.notifyPropertyChange('selectedDriverLabel', this._selectedDriverLabel);
        this.notifyPropertyChange('showDriverList', false);
    }

    // ── Save ─────────────────────────────────────────────────────────────────

    private validate(): boolean {
        if (!this._origin.trim()) {
            this._errorMessage = 'El punto de origen no puede estar vacío.';
            this.notifyPropertyChange('errorMessage', this._errorMessage);
            this.notifyPropertyChange('hasError', true);
            return false;
        }
        if (!this._destination.trim()) {
            this._errorMessage = 'El punto de destino no puede estar vacío.';
            this.notifyPropertyChange('errorMessage', this._errorMessage);
            this.notifyPropertyChange('hasError', true);
            return false;
        }
        return true;
    }

    async onSave(): Promise<void> {
        this._errorMessage = '';
        this.notifyPropertyChange('errorMessage', '');
        this.notifyPropertyChange('hasError', false);

        if (!this.validate()) return;

        this._isLoading = true;
        this.notifyPropertyChange('isLoading', true);

        try {
            await this._service.updateDelivery(
                this._deliveryId,
                this._origin.trim(),
                this._destination.trim(),
                this._selectedDriverId,
            );
            this._showSuccess = true;
            this.notifyPropertyChange('showSuccess', true);
            setTimeout(() => Frame.topmost().goBack(), 1500);
        } catch (e: any) {
            this._errorMessage = e.message ?? 'Error al guardar. Intente nuevamente.';
            this.notifyPropertyChange('errorMessage', this._errorMessage);
            this.notifyPropertyChange('hasError', true);
        } finally {
            this._isLoading = false;
            this.notifyPropertyChange('isLoading', false);
        }
    }

    onDismissSuccess(): void { Frame.topmost().goBack(); }

    onBack(): void { Frame.topmost().goBack(); }
}
