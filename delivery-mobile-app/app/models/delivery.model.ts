export interface Delivery {
    id: number;
    client: string;
    driver: string;
    origin: string;
    destination: string;
    status: 'pending' | 'en_way' | 'delivered' | 'canceled';
}

export interface DeliveryDetail {
    id: number;
    status: string;
    origin: string;
    destination: string;
    driver: { id: number; name: string; phone: string; photoUrl: string | null; verified: boolean };
    client: { name: string; email: string; registeredSince: string };
}