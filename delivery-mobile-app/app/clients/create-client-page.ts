import { EventData, Page } from '@nativescript/core';
import { CreateClientViewModel } from './create-client-view-model';

export function onNavigatingTo(args: EventData): void {
    const page = args.object as Page;
    page.bindingContext = new CreateClientViewModel();
}
