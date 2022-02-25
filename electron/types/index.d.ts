import services from '@/services';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Service = (...arg: any[]) => Promise<any>;

export type ServiceNames = keyof typeof services;

export interface Project {
    type: string;
    file: string;
    preview: string;
    title: string;
}
