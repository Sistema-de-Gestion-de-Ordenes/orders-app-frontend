import { Observable, ImageSource, Frame, knownFolders, path } from '@nativescript/core';
import { requestPermissions, takePicture } from '@nativescript/camera';
import { ImagePicker } from '@nativescript/imagepicker';
import { ClientService } from '../services/client.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class CreateClientViewModel extends Observable {
    private _name: string = '';
    private _email: string = '';
    private _password: string = '';
    private _phone: string = '';
    private _profilePhotoSource: ImageSource | null = null;
    private _profilePhotoPath: string | null = null;
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _showSuccess: boolean = false;

    private clientService = new ClientService();

    get name(): string { return this._name; }
    set name(value: string) { this._name = value; this.notifyPropertyChange('name', value); }

    get email(): string { return this._email; }
    set email(value: string) { this._email = value; this.notifyPropertyChange('email', value); }

    get password(): string { return this._password; }
    set password(value: string) { this._password = value; this.notifyPropertyChange('password', value); }

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

    onBack(): void {
        Frame.topmost().goBack();
    }

    onGoToEntregas(): void {
        Frame.topmost().navigate({ moduleName: 'home/home-page', clearHistory: true });
    }

    onGoToRepartidores(): void {
        Frame.topmost().navigate({ moduleName: 'drivers/create-driver-page', clearHistory: true });
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
            await this.clientService.createClient({
                name: this._name.trim(),
                email: this._email.trim(),
                password: this._password,
                phone: this._phone.trim(),
                profilePhotoPath: this._profilePhotoPath!,
            });

            this.showSuccess = true;
            this.resetForm();
        } catch (error: any) {
            this.errorMessage = error.message || 'Error al guardar el cliente. Intente de nuevo.';
        } finally {
            this.isLoading = false;
        }
    }

    private validate(): boolean {
        if (!this._name.trim()) {
            this.errorMessage = 'El nombre completo es requerido.';
            return false;
        }
        if (!this._email.trim() || !EMAIL_REGEX.test(this._email.trim())) {
            this.errorMessage = 'Ingrese un correo electrónico válido.';
            return false;
        }
        if (!this._password || this._password.length < 8) {
            this.errorMessage = 'La contraseña debe tener al menos 8 caracteres.';
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
        this.name = '';
        this.email = '';
        this.password = '';
        this.phone = '';
        this.profilePhotoSource = null;
        this._profilePhotoPath = null;
    }
}
