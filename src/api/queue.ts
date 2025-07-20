import { QueueClient } from '@/queue/queue_client';
import { RabbitMQClient } from '@/queue/rabbitmq_client';
import { BaseEvent } from '@/models/event';

let client: QueueClient | null = null;

const initializeQueue = async (url: string): Promise<QueueClient> => {
    if (client) {
        console.warn('Queue client is already initialized. Returning existing instance.');
        return client;
    }

    try {
        client = new RabbitMQClient();
        await client.initializeQueue(url);
        console.log('RabbitMQ client initialized successfully');
        return client;
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
};

const publishEvent = async (event: BaseEvent): Promise<void> => {
    if (!client) {
        throw new Error('Queue client not initialized. Call initializeQueue first.');
    }
    
    try {
        await client.publishEvent(event);
        console.log('Message published successfully');
    } catch (error) {
        console.error('Failed to publish message:', error);
        throw error;
    }
};

const publishScheduleEvent = async (scheduleEvent: BaseEvent): Promise<void> => {
    if (!client) {
        throw new Error('Queue client not initialized. Call initializeQueue first.');
    }

    try {
        await client.publishScheduleEvent(scheduleEvent);
        console.log('Schedule event published successfully');
    } catch (error) {
        console.error('Failed to publish schedule event:', error);
        throw error;
    }
};

const bindSubscriberToSchedule = async (providerId: string, subscriberId: string): Promise<void> => {
    if (!client) {
        throw new Error('Queue client not initialized. Call initializeQueue first.');
    }

    try {
        await client.bindSubscriberToSchedule(providerId, subscriberId);
        console.log(`Subscriber ${subscriberId} bound to schedule ${providerId} successfully`);
    } catch (error) {
        console.error(`Failed to bind subscriber ${subscriberId} to schedule ${providerId}:`, error);
        throw error;
    }
};

const unbindSubscriberToSchedule = async (providerId: string, subscriberId: string): Promise<void> => {
    if (!client) {
        throw new Error('Queue client not initialized. Call initializeQueue first.');
    }

    try {
        await client.unbindSubscriberToSchedule(providerId, subscriberId);
        console.log(`Subscriber ${subscriberId} unbound from schedule ${providerId} successfully`);
    } catch (error) {
        console.error(`Failed to unbind subscriber ${subscriberId} from schedule ${providerId}:`, error);
        throw error;
    }
};


const subscribeUser = async (userId: string, callback: (event: BaseEvent, ack: () => void, nack: () => void) => void): Promise<void> => {
    if (!client) {
        throw new Error('Queue client not initialized. Call initializeQueue first.');
    }

    try {
        await client.subscribeUser(userId, callback);
        console.log(`Subscribed to user queue ${userId} successfully`);
    } catch (error) {
        console.error(`Failed to subscribe to user queue ${userId}:`, error);
        throw error;
    }
};

const unsubscribeUser = async (userId: string): Promise<void> => {
    if (!client) {
        throw new Error('Queue client not initialized. Call initializeQueue first.');
    }

    try {
        await client.unsubscribeUser(userId);
        console.log(`Unsubscribed from user queue ${userId} successfully`);
    } catch (error) {
        console.error(`Failed to unsubscribe from user queue ${userId}:`, error);
        throw error;
    }
};

const removeQueue = async (queueName: string): Promise<void> => {
    if (!client) {
        throw new Error('Queue client not initialized. Call initializeQueue first.');
    }

    try {
        await client.removeQueue(queueName);
        console.log(`Queue ${queueName} removed successfully`);
    } catch (error) {
        console.error(`Failed to remove queue ${queueName}:`, error);
        throw error;
    }
};

const removeExchange = async (exchangeName: string): Promise<void> => {
    if (!client) {
        throw new Error('Queue client not initialized. Call initializeQueue first.');
    }

    try {
        await client.removeExchange(exchangeName);
        console.log(`Exchange ${exchangeName} removed successfully`);
    } catch (error) {
        console.error(`Failed to remove exchange ${exchangeName}:`, error);
        throw error;
    }
};

const shutdown = async (): Promise<void> => {
    if (!client) {
        throw new Error('Queue client not initialized. Call initializeQueue first.');
    }

    try {
        await client.shutdown();
        client = null; // Clear the client after shutdown
        console.log('RabbitMQ client shutdown successfully');
    } catch (error) {
        console.error('Failed to shutdown RabbitMQ client:', error);
        throw error;
    }
};

export {
    initializeQueue,
    publishEvent,
    publishScheduleEvent,
    bindSubscriberToSchedule,
    unbindSubscriberToSchedule,
    subscribeUser,
    unsubscribeUser,
    removeQueue,
    removeExchange,
    shutdown,
    client as queueClient
};