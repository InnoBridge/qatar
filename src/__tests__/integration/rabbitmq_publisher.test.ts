import * as dotenv from 'dotenv';
import path from 'path';
import { RabbitMQClient } from '@/queue/rabbitmq_client';
import { QueueClient } from '@/queue/queue_client';
import { BaseEvent } from '@/models/event';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const RABBITMQ_URL = process.env.RABBITMQ_URL;

interface Message {
    chatId: string;
    messageId: string;
    userIds: string[];
    senderId: string;
    content: string;
    createdAt: number;
};

interface MessageEvent extends BaseEvent {
    type: 'message';
    message: Message;
};

interface ScheduleEvent extends BaseEvent {
    type: 'schedule';
    userIds: string[];
};


const initializationClient = async (url: string): Promise<QueueClient> => {
    const client = new RabbitMQClient();
    try {
        await client.initializeQueue(url);
        console.log('Connected to RabbitMQ');
        return client;
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
};

const publishMessageTest = async (client: QueueClient): Promise<void> => {
    console.log('Starting publishMessageTest...');

    const message: Message = 
        {
            chatId: 'chat-123',
            messageId: 'message-123',
            userIds: ['123', '456'],
            senderId: '123',
            content: 'Hello, this is a new test message!',
            createdAt: new Date().getTime(),
        };

    const messageEvent: MessageEvent = {
        type: 'message',
        userIds: message.userIds,
        message: message
    };

    try {
        await client.publishEvent(messageEvent);
        console.log('Message published successfully');
    } catch (error) {
        console.error('Failed to publish message:', error);
        throw error;
    }
};

const publishScheduleTest = async (client: QueueClient): Promise<void> => {
    console.log('Starting publishScheduleTest...');

    const scheduleEvent: ScheduleEvent = 
        {
            type: 'schedule',
            userIds: ['123'],
        };

    try {
        await client.publishScheduleEvent(scheduleEvent);
        console.log('Schedule event published successfully');
    } catch (error) {
        console.error('Failed to publish schedule event:', error);
        throw error;
    }
};


const removeQueueTest = async (client: QueueClient, queueName: string): Promise<void> => {
    console.log(`Starting removeQueueTest`);
    try {
        await client.removeQueue(queueName);
        console.log(`Queue ${queueName} removed successfully`);
    } catch (error) {
        console.error(`Failed to remove queue ${queueName}:`, error);
        throw error;
    }
};

const shutdownTest = async (client: QueueClient): Promise<void> => {
    console.log('Starting shutdownTest...');
    try {
        await client.shutdown();
        console.log('RabbitMQ client shutdown successfully');
    } catch (error) {
        console.error('Failed to shutdown RabbitMQ client:', error);
        throw error;
    }
};

(async function main() {
    try {
        const client = await initializationClient(RABBITMQ_URL!);
        
        // await publishMessageTest(client);
        await publishScheduleTest(client)
        // await removeQueueTest(client, 'user-user-123');
        // await removeQueueTest(client, 'user-user-456');

        await shutdownTest(client);

        console.log("🎉 RabbitMQ Publisher integration test passed");
    } catch (err) {
        console.error("❌ RabbitMQ Publisher integration test failed:", err);
        process.exit(1);
    }
})();
