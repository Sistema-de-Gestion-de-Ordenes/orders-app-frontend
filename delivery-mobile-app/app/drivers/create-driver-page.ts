import { EventData, Page } from '@nativescript/core';
import { CreateDriverViewModel } from './create-driver-view-model';

export function onNavigatingTo(args: EventData): void {
    const page = args.object as Page;
    page.bindingContext = new CreateDriverViewModel();
}
