import { Application } from '@nativescript/core'

declare const net: any;

Application.on(Application.launchEvent, () => {
    if (global.isAndroid) {
        try {
            const context = Application.android.context;
            const nativeApp = Application.android.nativeApp;
            const packageName = context.getPackageName();

            // Initialize background-http upload service
            net.gotev.uploadservice.UploadServiceConfig.initialize(nativeApp, packageName, false);

            // Create notification channel required on Android 8+
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
})

Application.run({ moduleName: 'app-root' })
