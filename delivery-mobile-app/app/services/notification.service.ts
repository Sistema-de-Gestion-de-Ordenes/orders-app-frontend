import { ApplicationSettings, Dialogs, Frame } from '@nativescript/core';
import messaging from '@nativescript/firebase-messaging';

const PENDING_DELIVERY_KEY = 'pending_notification_delivery_id';

export class NotificationService {
    private static handlersRegistered = false;

    setupHandlers(): void {
        if (NotificationService.handlersRegistered) return;
        NotificationService.handlersRegistered = true;

        // Foreground: app is open — show in-app dialog with option to navigate
        messaging().onMessage(async (message) => {
            const title = message.notification?.title ?? 'Notification';
            const body  = message.notification?.body  ?? '';
            const deliveryId = this.extractDeliveryId(message);

            if (deliveryId !== null) {
                const goToDetail = await Dialogs.confirm({
                    title,
                    message: body,
                    okButtonText:     'View delivery',
                    cancelButtonText: 'Dismiss',
                });
                if (goToDetail) this.navigateToDelivery(deliveryId);
            } else {
                await Dialogs.alert({ title, message: body, okButtonText: 'OK' });
            }
        });

        // Background tap: app was suspended — navigate immediately
        messaging().onNotificationOpenedApp((message) => {
            const deliveryId = this.extractDeliveryId(message);
            if (deliveryId !== null) {
                this.navigateToDelivery(deliveryId);
            }
        });

        // Cold-start tap: app was killed — store id, navigate once home loads
        messaging().getInitialNotification()
            .then((message) => {
                if (!message) return;
                const deliveryId = this.extractDeliveryId(message);
                if (deliveryId !== null) {
                    ApplicationSettings.setString(PENDING_DELIVERY_KEY, String(deliveryId));
                }
            })
            .catch(() => {});
    }

    checkPendingNavigation(): void {
        const raw = ApplicationSettings.getString(PENDING_DELIVERY_KEY);
        if (!raw) return;
        ApplicationSettings.remove(PENDING_DELIVERY_KEY);
        this.navigateToDelivery(Number(raw));
    }

    private extractDeliveryId(message: any): number | null {
        const raw = message?.data?.deliveryId ?? message?.data?.delivery_id;
        if (raw == null) return null;
        const id = Number(raw);
        return isNaN(id) ? null : id;
    }

    private navigateToDelivery(deliveryId: number): void {
        Frame.topmost().navigate({
            moduleName: 'delivery-detail/delivery-detail-page',
            context: { deliveryId },
        });
    }
}
