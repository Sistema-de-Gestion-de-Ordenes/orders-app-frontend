import { Connectivity } from '@nativescript/core';

export class ConnectivityService {
    isConnected(): boolean {
        const type = Connectivity.getConnectionType();
        return type !== Connectivity.connectionType.none;
    }
}
