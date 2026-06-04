import { NavigatedData, Page } from '@nativescript/core';
import { EditDeliveryViewModel } from './edit-delivery-view-model';

export function onNavigatingTo(args: NavigatedData): void {
    const page = args.object as Page;
    const deliveryId = (args.context as { deliveryId: number }).deliveryId;
    page.bindingContext = new EditDeliveryViewModel(deliveryId);
}
