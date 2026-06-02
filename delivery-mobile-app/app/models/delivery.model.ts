export interface Delivery {
    id: number;
    client: string;
    driver: string;
    origin: string;
    destination: string;
    status: 'pending' | 'en_way' | 'delivered' | 'canceled';
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