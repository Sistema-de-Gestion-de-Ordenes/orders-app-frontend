import { Observable, ImageSource, Frame, knownFolders, path } from '@nativescript/core';
import { requestPermissions, takePicture } from '@nativescript/camera';
import { ImagePicker } from '@nativescript/imagepicker';
import { DriverService } from '../services/driver.service';

export class CreateDriverViewModel extends Observable {
    private _name: string = '';
    private _vehicle: string = '';
    private _plates: string = '';
    private _phone: string = '';
    private _profilePhotoSource: ImageSource | null = null;
    private _profilePhotoPath: string | null = null;
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _showSuccess: boolean = false;
    private _driversCount: number = 0;

    private driverService = new DriverService();

    constructor() {
        super();
        this.loadDriversCount();
    }

    get name(): string { return this._name; }
    set name(value: string) { this._name = value; this.notifyPropertyChange('name', value); }

    get vehicle(): string { return this._vehicle; }
    set vehicle(value: string) { this._vehicle = value; this.notifyPropertyChange('vehicle', value); }

    get plates(): string { return this._plates; }
    set plates(value: string) { this._plates = value; this.notifyPropertyChange('plates', value); }

    get phone(): string { return this._phone; }
    set phone(value: string) { this._phone = value; this.notifyPropertyChange('phone', value); }

    get profilePhotoSource(): ImageSource | null { return this._profilePhotoSource; }
    set profilePhotoSource(value: ImageSource | null) {
        this._profilePhotoSource = value;
        this.notifyPropertyChange('profilePhotoSource', value);
        this.notifyPropertyChange('hasProfilePhoto', this.hasProfilePhoto);
    }

    get hasProfilePhoto(): boolean { return this._profilePhotoSource !== null; }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(value: boolean) { this._isLoading = value; this.notifyPropertyChange('isLoading', value); }

    get errorMessage(): string { return this._errorMessage; }
    set errorMessage(value: string) {
        this._errorMessage = value;
        this.notifyPropertyChange('errorMessage', value);
        this.notifyPropertyChange('hasError', this.hasError);
    }

    get hasError(): boolean { return this._errorMessage !== ''; }

    get showSuccess(): boolean { return this._showSuccess; }
    set showSuccess(value: boolean) {
        this._showSuccess = value;
        this.notifyPropertyChange('showSuccess', value);
    }

    get driversCount(): number { return this._driversCount; }
    set driversCount(value: number) {
        this._driversCount = value;
        this.notifyPropertyChange('driversCount', value);
    }

    private async loadDriversCount(): Promise<void> {
        try {
            this.driversCount = await this.driverService.getDriversCount();
        } catch { /* silently ignore */ }
    }

    onBack(): void {
        Frame.topmost().goBack();
    }

    onGoToEntregas(): void {
        Frame.topmost().navigate({ moduleName: 'home/home-page', clearHistory: true });
    }

    onGoToClientes(): void {
        Frame.topmost().navigate({ moduleName: 'clients/create-client-page', clearHistory: true });
    }

    onGoToPerfil(): void {}

    async onTakePhoto(): Promise<void> {
        try {
            await requestPermissions();
            const photo = await takePicture({ saveToGallery: false, allowsEditing: false });
            const source = await ImageSource.fromAsset(photo);
            const filePath = path.join(knownFolders.temp().path, `photo_${Date.now()}.jpg`);
            source.saveToFile(filePath, 'jpg');
            this._profilePhotoPath = filePath;
            this.profilePhotoSource = source;
        } catch (error: any) {
            this.errorMessage = 'No se pudo acceder a la cámara.';
        }
    }

    async onPickFromGallery(): Promise<void> {
        try {
            const picker = new ImagePicker({ mode: 'single' });
            await picker.authorize();
            const selection = await picker.present();
            if (selection.length > 0) {
                const selected = selection[0];
                const source = await ImageSource.fromAsset(selected.asset);
                const filePath = path.join(knownFolders.temp().path, `photo_${Date.now()}.jpg`);
                source.saveToFile(filePath, 'jpg');
                this._profilePhotoPath = filePath;
                this.profilePhotoSource = source;
            }
        } catch (error: any) {
            this.errorMessage = 'No se pudo acceder a la galería.';
        }
    }

    onDismissSuccess(): void {
        this.showSuccess = false;
    }

    async onSave(): Promise<void> {
        if (!this.validate()) return;

        this.isLoading = true;
        this.errorMessage = '';

        try {
            await this.driverService.createDriver({
                name:             this._name.trim(),
                vehicle:          this._vehicle.trim(),
                plates:           this._plates.trim(),
                phone:            this._phone.trim(),
                profilePhotoPath: this._profilePhotoPath!,
            });

            this.driversCount = this._driversCount + 1;
            this.showSuccess = true;
            this.resetForm();
        } catch (error: any) {
            this.errorMessage = error.message || 'Error al guardar el repartidor. Intente de nuevo.';
        } finally {
            this.isLoading = false;
        }
    }

    private validate(): boolean {
        if (!this._name.trim()) {
            this.errorMessage = 'El nombre completo es requerido.';
            return false;
        }
        if (!this._vehicle.trim()) {
            this.errorMessage = 'El vehículo es requerido.';
            return false;
        }
        if (!this._plates.trim()) {
            this.errorMessage = 'Las placas son requeridas.';
            return false;
        }
        if (!this._phone.trim()) {
            this.errorMessage = 'El teléfono es requerido.';
            return false;
        }
        if (!this._profilePhotoPath) {
            this.errorMessage = 'La foto de perfil es requerida.';
            return false;
        }
        this.errorMessage = '';
        return true;
    }

    private resetForm(): void {
        this.name    = '';
        this.vehicle = '';
        this.plates  = '';
        this.phone   = '';
        this.profilePhotoSource = null;
        this._profilePhotoPath  = null;
    }
}
