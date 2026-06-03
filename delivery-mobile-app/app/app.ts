import { Application } from '@nativescript/core'
import { NotificationService } from './services/notification.service'

declare const net: any;

Application.on(Application.launchEvent, () => {
    if (global.isAndroid) {
        try {
            const context = Application.android.context;
            const nativeApp = Application.android.nativeApp;
            const packageName = context.getPackageName();

            net.gotev.uploadservice.UploadServiceConfig.initialize(nativeApp, packageName, false);

            if (android.os.Build.VERSION.SDK_INT >= 26) {
                const channel = new android.app.NotificationChannel(
                    packageName,
                    'Upload',
                    android.app.NotificationManager.IMPORTANCE_LOW
                );
                channel.setShowBadge(false);
                const manager = context.getSystemService(
                    android.content.Context.NOTIFICATION_SERVICE
                ) as android.app.NotificationManager;
                manager.createNotificationChannel(channel);
            }
        } catch (e) {
            console.log('background-http init error:', e.message);
        }
    }

    // Register FCM message handlers as early as possible so no notification is missed
    try {
        new NotificationService().setupHandlers();
    } catch (e) {
        console.error('Notification handler setup error:', e);
    }
})

Application.run({ moduleName: 'app-root' })
