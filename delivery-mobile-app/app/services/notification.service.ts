import { Application, ApplicationSettings, Dialogs, Frame } from '@nativescript/core';
import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-messaging';

const PENDING_DELIVERY_KEY = 'pending_notification_delivery_id';

export class NotificationService {
    private static handlersRegistered = false;

    setupHandlers(): void {
        if (NotificationService.handlersRegistered) return;
        NotificationService.handlersRegistered = true;

        // Foreground: show native banner + dialog for navigation
        firebase().messaging().onMessage(async (message) => {
            const title = message.notification?.title ?? 'Notificación';
            const body  = message.notification?.body  ?? '';

            this.showLocalNotification(title, body);

            const deliveryId = this.extractDeliveryId(message);
            if (deliveryId !== null) {
                const goToDetail = await Dialogs.confirm({
                    title,
                    message: body,
                    okButtonText:     'Ver entrega',
                    cancelButtonText: 'Cerrar',
                });
                if (goToDetail) this.navigateToDelivery(deliveryId);
            }
        });

        // Notification tap (background or cold-start): navigate to delivery
        firebase().messaging().onNotificationTap((message) => {
            const deliveryId = this.extractDeliveryId(message);
            if (deliveryId !== null) {
                this.navigateToDelivery(deliveryId);
            }
        });
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

    showLocalNotification(title: string, body: string): void {
        if (!global.isAndroid) return;
        try {
            const context = Application.android.context;
            const CHANNEL_ID = 'delivery_updates';
            const nm = context.getSystemService(
                android.content.Context.NOTIFICATION_SERVICE
            ) as android.app.NotificationManager;

            if (android.os.Build.VERSION.SDK_INT >= 26) {
                if (nm.getNotificationChannel(CHANNEL_ID) === null) {
                    const channel = new android.app.NotificationChannel(
                        CHANNEL_ID,
                        'Actualizaciones de Entrega',
                        android.app.NotificationManager.IMPORTANCE_HIGH
                    );
                    channel.enableVibration(true);
                    nm.createNotificationChannel(channel);
                }
            }

            const notification = new android.app.Notification.Builder(context, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(context.getApplicationInfo().icon)
                .setAutoCancel(true)
                .build();

            nm.notify(Math.floor(Math.random() * 10000), notification);
        } catch (e) {
            console.error('Local notification error:', e);
        }
    }
}
