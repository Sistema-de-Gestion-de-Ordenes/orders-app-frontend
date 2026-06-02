export const API_CONFIG = {
    // Development options:
    // Emulator:        'http://10.0.2.2:5076'
    // Physical device: 'http://<your-local-ip>:5076'
    // iOS simulator:   'http://localhost:5076'
    BASE_URL: 'http://192.168.50.230:5076',
    ENDPOINTS: {
        LOGIN: '/auth/login',
        DELIVERIES: '/deliveries',
        CLIENTS:    '/clients',
        DRIVERS:    '/drivers',
        CREATE_CLIENT: '/clients',
    }
};
