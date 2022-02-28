import services from '@/services';

export type Services = typeof services;

export type ServiceNames = keyof Services;
