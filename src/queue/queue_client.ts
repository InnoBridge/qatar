import { BaseEvent } from '@/models/event';

interface QueueClient {
    initializeQueue(url: string): Promise<void>;
    publishEvent(event: BaseEvent): Promise<void>;
    subscribeUser(userId: string, eventHandler: (event: BaseEvent, ack: () => void, nack: () => void) => void): Promise<void>;
    unsubscribeUser(userId: string): Promise<void>;
    removeQueue(queueName: string): Promise<void>;
    removeExchange(exchangeName: string): Promise<void>;
    shutdown(): Promise<void>;
};

export {
    QueueClient,
};