import { api, unwrap } from './client.js';

export const listProducts = () => api.get('/api/products').then(unwrap);

export const getProduct = (id) => api.get(`/api/products/${id}`).then(unwrap);
