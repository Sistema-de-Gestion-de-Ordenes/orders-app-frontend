import { Observable, ObservableArray, Frame, alert } from '@nativescript/core';
import { DeliveryService } from '../services/delivery.service';
import { Client, Driver } from '../models/delivery.model';

export class CreateDeliveryViewModel extends Observable {
    private _clientNames      = new ObservableArray<string>();
    private _driverNames      = new ObservableArray<string>();

    private _selectedClientIndex: number = 0;
    private _selectedDriverIndex: number = 0;
    private _origin: string = '';
    private _destination: string = '';

    private _originSuggestions      = new ObservableArray<string>();
    private _destinationSuggestions = new ObservableArray<string>();
    private _showOriginSuggestions: boolean = false;
    private _showDestinationSuggestions: boolean = false;

    private _isLoadingDropdowns: boolean = false;
    private _isSubmitting: boolean = false;
    private _hasError: boolean = false;
    private _errorMessage: string = '';

    private deliveryService = new DeliveryService();
    private _clientData: Client[] = [];
    private _driverData: Driver[] = [];

    // Fix #3 — two separate timers, one per field
    private _originDebounceTimer: any = null;
    private _destinationDebounceTimer: any = null;

    constructor() {
        super();
        this.loadDropdowns();
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────

    get clientNames(): ObservableArray<string> { return this._clientNames; }
    get driverNames(): ObservableArray<string> { return this._driverNames; }
    get originSuggestions(): ObservableArray<string> { return this._originSuggestions; }
    get destinationSuggestions(): ObservableArray<string> { return this._destinationSuggestions; }

    get selectedClientIndex(): number { return this._selectedClientIndex; }
    set selectedClientIndex(value: number) {
        this._selectedClientIndex = value;
        this.notifyPropertyChange('selectedClientIndex', value);
    }

    get selectedDriverIndex(): number { return this._selectedDriverIndex; }
    set selectedDriverIndex(value: number) {
        this._selectedDriverIndex = value;
        this.notifyPropertyChange('selectedDriverIndex', value);
    }

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

    // ── Load dropdowns ────────────────────────────────────────────────────────

    async loadDropdowns(): Promise<void> {
        this.isLoadingDropdowns = true;
        this.hasError = false;

        try {
            const [clients, drivers] = await Promise.all([
                this.deliveryService.getClients(),
                this.deliveryService.getDrivers(),
            ]);

            this._clientData = clients;
            this._driverData = drivers;

            this._clientNames.splice(0, this._clientNames.length);
            this._driverNames.splice(0, this._driverNames.length);

            clients.forEach(c => this._clientNames.push(c.name));
            drivers.forEach(d => this._driverNames.push(`${d.name} — ${d.vehicle} (${d.plates})`));

            this.selectedClientIndex = 0;
            this.selectedDriverIndex = 0;
        } catch (error: any) {
            this.hasError = true;
            this.errorMessage = error.message ?? 'Failed to load data. Please try again.';
        } finally {
            this.isLoadingDropdowns = false;
        }
    }

    onRetryTap(): void {
        this.loadDropdowns();
    }

    // ── Nominatim autocomplete ────────────────────────────────────────────────

    private fetchSuggestions(query: string, field: 'origin' | 'destination'): void {
        // Fix #3 — each field has its own timer, typing in one doesn't cancel the other
        if (field === 'origin') {
            if (this._originDebounceTimer) clearTimeout(this._originDebounceTimer);
        } else {
            if (this._destinationDebounceTimer) clearTimeout(this._destinationDebounceTimer);
        }

        if (!query || query.length < 3) {
            if (field === 'origin') this.showOriginSuggestions = false;
            else this.showDestinationSuggestions = false;
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=4&countrycodes=cr`;
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'DeliveryMobileApp/1.0' }
                });
                const data = await response.json();
                const suggestions: string[] = data.map((item: any) => item.display_name);

                if (field === 'origin') {
                    this._originSuggestions.splice(0, this._originSuggestions.length);
                    suggestions.forEach(s => this._originSuggestions.push(s));
                    this.showOriginSuggestions = suggestions.length > 0;
                } else {
                    this._destinationSuggestions.splice(0, this._destinationSuggestions.length);
                    suggestions.forEach(s => this._destinationSuggestions.push(s));
                    this.showDestinationSuggestions = suggestions.length > 0;
                }
            } catch {
                // Silently fail — autocomplete is a convenience, not required
            }
        }, 400);

        // Fix #3 — store in the correct timer variable
        if (field === 'origin') this._originDebounceTimer = timer;
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
        if (this._clientData.length === 0) return 'No customers available.';
        if (this._driverData.length === 0) return 'No drivers available.';
        if (!this._origin.trim())          return 'Please enter an origin address.';
        if (!this._destination.trim())     return 'Please enter a destination address.';
        if (this._origin.trim() === this._destination.trim()) return 'Origin and destination cannot be the same.';
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

        const clientId = this._clientData[this._selectedClientIndex].id;
        const driverId = this._driverData[this._selectedDriverIndex].id;

        try {
            await this.deliveryService.createDelivery({
                clientId,
                driverId,
                origin:      this._origin.trim(),
                destination: this._destination.trim(),
            });

            await alert({
                title:        'Success',
                message:      'Delivery created successfully.',
                okButtonText: 'OK',
            });

            Frame.topmost().navigate({
                moduleName:   'home/home-page',
                clearHistory: true,
            });
        } catch (error: any) {
            this.hasError = true;
            this.errorMessage = error.message ?? 'Failed to create delivery. Please try again.';
        } finally {
            this.isSubmitting = false;
        }
    }

    onCancelTap(): void {
        Frame.topmost().goBack();
    }
}