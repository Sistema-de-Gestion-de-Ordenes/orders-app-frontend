import { NavigatedData, Page } from '@nativescript/core';
import { CreateDeliveryViewModel } from './create-delivery-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    page.bindingContext = new CreateDeliveryViewModel();
}