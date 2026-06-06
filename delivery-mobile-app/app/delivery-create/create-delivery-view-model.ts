import { Observable, ObservableArray, Frame, alert, ImageSource } from '@nativescript/core';
import { DeliveryService } from '../services/delivery.service';
import { GeocodingService } from '../services/geocoding.service';
import { API_CONFIG } from '../config/api.config';

interface ClientItem {
    id: number;
    label: string;
    photoSource: ImageSource | null;
    hasPhoto: boolean;
    isSelected: boolean;
}

interface DriverItem {
    id: number;
    label: string;
    photoSource: ImageSource | null;
    hasPhoto: boolean;
    isSelected: boolean;
}

export class CreateDeliveryViewModel extends Observable {

    // ── ListView arrays ───────────────────────────────────────────────────────
    private _clients = new ObservableArray<ClientItem>();
    private _drivers = new ObservableArray<DriverItem>();

    // Currently selected index
    private _selectedClientIndex: number = 0;
    private _selectedDriverIndex: number = 0;

    // ── Route fields ──────────────────────────────────────────────────────────
    private _origin: string = '';
    private _destination: string = '';

    private _originSuggestions      = new ObservableArray<string>();
    private _destinationSuggestions = new ObservableArray<string>();
    private _showOriginSuggestions      = false;
    private _showDestinationSuggestions = false;
    private _isLoadingOriginSuggestions      = false;
    private _isLoadingDestinationSuggestions = false;
    private _showOriginOffline      = false;
    private _showDestinationOffline = false;

    private _originDebounceTimer:      any = null;
    private _destinationDebounceTimer: any = null;

    // ── UI state ──────────────────────────────────────────────────────────────
    private _isLoadingDropdowns = false;
    private _isSubmitting       = false;
    private _hasError           = false;
    private _errorMessage       = '';

    private deliveryService  = new DeliveryService();
    private geocodingService = new GeocodingService();

    constructor() {
        super();
        this.loadDropdowns();
    }

    // ── Getters exposed to the XML ────────────────────────────────────────────

    get clients(): ObservableArray<ClientItem> { return this._clients; }
    get drivers(): ObservableArray<DriverItem> { return this._drivers; }

    get originSuggestions():      ObservableArray<string> { return this._originSuggestions; }
    get destinationSuggestions(): ObservableArray<string> { return this._destinationSuggestions; }

    get origin(): string { return this._origin; }
    set origin(value: string) {
        this._origin = value;
        this.notifyPropertyChange('origin', value);
        this.fetchSuggestions(value, 'origin');
    }

    get destination(): string { return this._destination; }
    set destination(value: string) {
        this._destination = value;
        this.notifyPropertyChange('destination', value);
        this.fetchSuggestions(value, 'destination');
    }

    get showOriginSuggestions(): boolean { return this._showOriginSuggestions; }
    set showOriginSuggestions(value: boolean) {
        this._showOriginSuggestions = value;
        this.notifyPropertyChange('showOriginSuggestions', value);
    }

    get showDestinationSuggestions(): boolean { return this._showDestinationSuggestions; }
    set showDestinationSuggestions(value: boolean) {
        this._showDestinationSuggestions = value;
        this.notifyPropertyChange('showDestinationSuggestions', value);
    }

    get isLoadingOriginSuggestions(): boolean { return this._isLoadingOriginSuggestions; }
    set isLoadingOriginSuggestions(value: boolean) {
        this._isLoadingOriginSuggestions = value;
        this.notifyPropertyChange('isLoadingOriginSuggestions', value);
    }

    get isLoadingDestinationSuggestions(): boolean { return this._isLoadingDestinationSuggestions; }
    set isLoadingDestinationSuggestions(value: boolean) {
        this._isLoadingDestinationSuggestions = value;
        this.notifyPropertyChange('isLoadingDestinationSuggestions', value);
    }

    get showOriginOffline(): boolean { return this._showOriginOffline; }
    set showOriginOffline(value: boolean) {
        this._showOriginOffline = value;
        this.notifyPropertyChange('showOriginOffline', value);
    }

    get showDestinationOffline(): boolean { return this._showDestinationOffline; }
    set showDestinationOffline(value: boolean) {
        this._showDestinationOffline = value;
        this.notifyPropertyChange('showDestinationOffline', value);
    }

    get isLoadingDropdowns(): boolean { return this._isLoadingDropdowns; }
    set isLoadingDropdowns(value: boolean) {
        this._isLoadingDropdowns = value;
        this.notifyPropertyChange('isLoadingDropdowns', value);
    }

    get isSubmitting(): boolean { return this._isSubmitting; }
    set isSubmitting(value: boolean) {
        this._isSubmitting = value;
        this.notifyPropertyChange('isSubmitting', value);
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

    // ── Data loading (mock data or real API in the future) ────────────────────

    async loadDropdowns(): Promise<void> {
        this.isLoadingDropdowns = true;
        this.hasError = false;

        try {
            const [clients, drivers] = await Promise.all([
                this.deliveryService.getClients(),
                this.deliveryService.getDrivers(),
            ]);

            this._clients.splice(0, this._clients.length);
            this._drivers.splice(0, this._drivers.length);

            clients.forEach((c, i) => {
                const item: ClientItem = {
                    id:          c.id,
                    label:       c.name,
                    photoSource: null,
                    hasPhoto:    false,
                    isSelected:  i === 0,
                };
                this._clients.push(item);
                if (c.photoUrl) {
                    const idx = i;
                    ImageSource.fromUrl(`${API_CONFIG.BASE_URL}${c.photoUrl}`)
                        .then(src => {
                            const current = this._clients.getItem(idx);
                            this._clients.setItem(idx, { ...current, photoSource: src, hasPhoto: true });
                        })
                        .catch(() => {});
                }
            });

            drivers.forEach((d, i) => {
                const item: DriverItem = {
                    id:          d.id,
                    label:       `${d.name} — ${d.vehicle} (${d.plates})`,
                    photoSource: null,
                    hasPhoto:    false,
                    isSelected:  i === 0,
                };
                this._drivers.push(item);
                if (d.photoUrl) {
                    const idx = i;
                    ImageSource.fromUrl(`${API_CONFIG.BASE_URL}${d.photoUrl}`)
                        .then(src => {
                            const current = this._drivers.getItem(idx);
                            this._drivers.setItem(idx, { ...current, photoSource: src, hasPhoto: true });
                        })
                        .catch(() => {});
                }
            });

            this._selectedClientIndex = 0;
            this._selectedDriverIndex = 0;

        } catch (error: any) {
            this.hasError = true;
            this.errorMessage = error.message ?? 'No se pudieron cargar los datos. Intenta de nuevo.';
        } finally {
            this.isLoadingDropdowns = false;
        }
    }

    onRetryTap(): void {
        this.loadDropdowns();
    }

    // ── Client selection via tap ──────────────────────────────────────────────
    // The XML uses itemTap="onClientTap" on the clients ListView.

    onClientTap(args: any): void {
        const newIndex: number = args.index;
        if (newIndex === this._selectedClientIndex) return;

        // Deselect the previous item and select the new one
        const prev = this._clients.getItem(this._selectedClientIndex);
        this._clients.setItem(this._selectedClientIndex, { ...prev, isSelected: false });

        const next = this._clients.getItem(newIndex);
        this._clients.setItem(newIndex, { ...next, isSelected: true });

        this._selectedClientIndex = newIndex;
    }

    // ── Driver selection via tap ──────────────────────────────────────────────

    onDriverTap(args: any): void {
        const newIndex: number = args.index;
        if (newIndex === this._selectedDriverIndex) return;

        const prev = this._drivers.getItem(this._selectedDriverIndex);
        this._drivers.setItem(this._selectedDriverIndex, { ...prev, isSelected: false });

        const next = this._drivers.getItem(newIndex);
        this._drivers.setItem(newIndex, { ...next, isSelected: true });

        this._selectedDriverIndex = newIndex;
    }

    // ── Nominatim autocomplete ────────────────────────────────────────────────

    private fetchSuggestions(query: string, field: 'origin' | 'destination'): void {
        const isOrigin = field === 'origin';

        if (isOrigin) {
            if (this._originDebounceTimer) clearTimeout(this._originDebounceTimer);
        } else {
            if (this._destinationDebounceTimer) clearTimeout(this._destinationDebounceTimer);
        }

        // Reset all suggestion states for this field
        if (isOrigin) {
            this.showOriginSuggestions      = false;
            this.showOriginOffline          = false;
            this.isLoadingOriginSuggestions = false;
        } else {
            this.showDestinationSuggestions      = false;
            this.showDestinationOffline          = false;
            this.isLoadingDestinationSuggestions = false;
        }

        if (!query || query.length < 2) return;

        // Block API call if offline and show message immediately
        if (!this.geocodingService.isOnline()) {
            if (isOrigin) this.showOriginOffline = true;
            else this.showDestinationOffline = true;
            return;
        }

        const timer = setTimeout(async () => {
            if (isOrigin) this.isLoadingOriginSuggestions = true;
            else this.isLoadingDestinationSuggestions = true;

            try {
                const suggestions = await this.geocodingService.getSuggestions(query);

                if (isOrigin) {
                    this._originSuggestions.splice(0, this._originSuggestions.length);
                    suggestions.forEach(s => this._originSuggestions.push(s));
                    this.isLoadingOriginSuggestions = false;
                    this.showOriginSuggestions = suggestions.length > 0;
                } else {
                    this._destinationSuggestions.splice(0, this._destinationSuggestions.length);
                    suggestions.forEach(s => this._destinationSuggestions.push(s));
                    this.isLoadingDestinationSuggestions = false;
                    this.showDestinationSuggestions = suggestions.length > 0;
                }
            } catch {
                if (isOrigin) this.isLoadingOriginSuggestions = false;
                else this.isLoadingDestinationSuggestions = false;
            }
        }, 500);

        if (isOrigin) this._originDebounceTimer = timer;
        else this._destinationDebounceTimer = timer;
    }

    onOriginSuggestionTap(args: any): void {
        const selected = this._originSuggestions.getItem(args.index);
        this._origin = selected;
        this.notifyPropertyChange('origin', selected);
        this.showOriginSuggestions = false;
    }

    onDestinationSuggestionTap(args: any): void {
        const selected = this._destinationSuggestions.getItem(args.index);
        this._destination = selected;
        this.notifyPropertyChange('destination', selected);
        this.showDestinationSuggestions = false;
    }

    // ── Validation ────────────────────────────────────────────────────────────

    private validate(): string | null {
        if (this._clients.length === 0)  return 'No hay clientes disponibles.';
        if (this._drivers.length === 0)  return 'No hay repartidores disponibles.';
        if (!this._origin.trim())        return 'Por favor ingresa la dirección de origen.';
        if (!this._destination.trim())   return 'Por favor ingresa la dirección de destino.';
        if (this._origin.trim() === this._destination.trim())
            return 'El origen y el destino no pueden ser iguales.';
        return null;
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    async onSubmitTap(): Promise<void> {
        const validationError = this.validate();
        if (validationError) {
            this.hasError = true;
            this.errorMessage = validationError;
            return;
        }

        this.isSubmitting = true;
        this.hasError = false;

        // Read ids directly from the selected items
        const clientItem = this._clients.getItem(this._selectedClientIndex);
        const driverItem = this._drivers.getItem(this._selectedDriverIndex);

        try {
            await this.deliveryService.createDelivery({
                clientId:    clientItem.id,
                driverId:    driverItem.id,
                origin:      this._origin.trim(),
                destination: this._destination.trim(),
            });

            await alert({
                title:        'Éxito',
                message:      'Entrega creada correctamente.',
                okButtonText: 'OK',
            });

            Frame.topmost().navigate({
                moduleName:   'home/home-page',
                clearHistory: true,
            });
        } catch (error: any) {
            this.hasError = true;
            this.errorMessage = error.message ?? 'No se pudo crear la entrega. Intenta de nuevo.';
        } finally {
            this.isSubmitting = false;
        }
    }

    onCancelTap(): void {
        Frame.topmost().navigate({
        moduleName: 'home/home-page',
        clearHistory: true,
    });
    }
}