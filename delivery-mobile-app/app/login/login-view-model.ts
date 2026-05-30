import { Observable, Frame } from '@nativescript/core';
import { AuthService } from '../services/auth.service';

export class LoginViewModel extends Observable {
    private _email: string = '';
    private _password: string = '';
    private _isLoading: boolean = false;
    private _errorMessage: string = '';
    private _isPasswordVisible: boolean = false;

    private authService = new AuthService();

    get email(): string { return this._email; }
    set email(value: string) {
        this._email = value;
        this.notifyPropertyChange('email', value);
    }

    get password(): string { return this._password; }
    set password(value: string) {
        this._password = value;
        this.notifyPropertyChange('password', value);
    }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(value: boolean) {
        this._isLoading = value;
        this.notifyPropertyChange('isLoading', value);
    }

    get errorMessage(): string { return this._errorMessage; }
    set errorMessage(value: string) {
        this._errorMessage = value;
        this.notifyPropertyChange('errorMessage', value);
        this.notifyPropertyChange('hasError', this.hasError);
    }

    get isPasswordVisible(): boolean { return this._isPasswordVisible; }
    set isPasswordVisible(value: boolean) {
        this._isPasswordVisible = value;
        this.notifyPropertyChange('isPasswordVisible', value);
        this.notifyPropertyChange('passwordSecure', this.passwordSecure);
    }

    get hasError(): boolean {
        return this._errorMessage !== '';
    }

    get passwordSecure(): boolean {
        return !this._isPasswordVisible;
    }

    async onLoginTap(): Promise<void> {
        if (!this._email.trim() || !this._password.trim()) {
            this.errorMessage = 'Please enter your email and password.';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        try {
            const token = await this.authService.login(this._email, this._password);
            this.authService.saveToken(token);
            Frame.topmost().navigate({
                moduleName: 'home/home-page',
                clearHistory: true,
            });
        } catch (error: any) {
            this.errorMessage = error.message || 'Login failed. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    onTogglePassword(): void {
        this.isPasswordVisible = !this._isPasswordVisible;
    }
}
