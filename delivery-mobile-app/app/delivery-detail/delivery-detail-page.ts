import { NavigatedData, Page } from '@nativescript/core';
import { DeliveryDetailViewModel } from './delivery-detail-view-model';

export function onNavigatingTo(args: NavigatedData): void {
    const page = <Page>args.object;
    const context = page.navigationContext as { deliveryId: number; fromHistory?: boolean };
    page.bindingContext = new DeliveryDetailViewModel(context.deliveryId, context.fromHistory ?? false);
}
