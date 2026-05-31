export interface Delivery {
    id: number;
    client: string;
    driver: string;
    origin: string;
    destination: string;
    status: 'pending' | 'en_way' | 'delivered' | 'canceled';
}