export interface Delivery {
    id: number;
    client: string;
    driver: string;
    origin: string;
    destination: string;
    status: string;
}

export interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
}

export interface Driver {
    id: number;
    name: string;
    vehicle: string;
    plates: string;
}

export interface CreateDeliveryRequest {
    clientId: number;
    driverId: number;
    origin: string;
    destination: string;
}

export interface DeliveryClientDetail {
    name: string;
    email: string;
    registeredSince: string;
}

export interface DeliveryDriverDetail {
    id: number;
    name: string;
    phone: string;
    photoUrl?: string;
    verified: boolean;
}

export interface DeliveryDetail {
    id: number;
    status: string;
    origin: string;
    destination: string;
    client: DeliveryClientDetail;
    driver: DeliveryDriverDetail;
}

export interface DeliveryHistory {
    id: number;
    client: string;
    clientPhotoUrl?: string;
    driver: string;
    driverPhotoUrl?: string;
    origin: string;
    destination: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}
