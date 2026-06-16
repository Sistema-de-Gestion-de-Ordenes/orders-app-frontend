import { EventData, Page } from '@nativescript/core';
import { LoginViewModel } from './login-view-model';

export function onNavigatingTo(args: EventData): void {
    const page = args.object as Page;
    page.bindingContext = new LoginViewModel();
}
