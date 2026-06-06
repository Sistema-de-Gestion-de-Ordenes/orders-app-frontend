import { NavigatedData, Page, Frame } from '@nativescript/core'
import { DeliveryHistoryViewModel } from './delivery-history-view-model'

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object
    page.bindingContext = new DeliveryHistoryViewModel()
}

export function onGoBack() {
    Frame.topmost().goBack()
}
