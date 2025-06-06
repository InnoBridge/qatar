import * as dotenv from 'dotenv';
import path from 'path';
import { 
    initializeQueue,
    shutdown
} from '@/api/queue';
import { publishMessage } from '@/api/messages';
import { Message } from '@/models/message';
import { MessageEvent } from '@/models/event';

const RABBITMQ_URL = process.env.RABBITMQ_URL;

const initializeQueueTest = async (url: string) => {
    console.log(`Initializing RabbitMQ client with URL: ${url}`);
    try {
        await initializeQueue(url);
        console.log('RabbitMQ client initialized successfully');
    } catch (error) {
        console.error('Failed to initialize RabbitMQ client:', error);
        throw error;
    }
};

const publishMessageTest = async () => {
    console.log('Starting publishMessageTest...');

    const message1: Message = 
        {
            chatId: 'chat-123',
            messageId: 'message-123',
            userIds: ['123'],
            senderId: '123',
            content: 'Hello, this is a new test message!',
            createdAt: new Date().getTime(),
        };
    const message2: Message = 
        {
            chatId: 'chat-123',
            messageId: 'message-123',
            userIds: ['456'],
            senderId: '123',
            content: 'Hello, this is a new test message!',
            createdAt: new Date().getTime(),
        };
    const message3: Message = 
        {
            chatId: 'chat-123',
            messageId: 'message-123',
            userIds: ['123', '456'],
            senderId: '123',
            content: 'Hello, this is a new test message!',
            createdAt: new Date().getTime(),
        };
    const messageEvent1: MessageEvent = {
        type: 'message',
        userIds: message1.userIds,
        message: message1,
    };
    const messageEvent2: MessageEvent = {
        type: 'message',
        userIds: message2.userIds,
        message: message2,
    };
    const messageEvent3: MessageEvent = {
        type: 'message',
        userIds: message3.userIds,
        message: message3,
    };
    
    try {
        await publishMessage(messageEvent1);
        await publishMessage(messageEvent2);
        await publishMessage(messageEvent3);
        console.log('Message published successfully');
    } catch (error) {
        console.error('Failed to publish message:', error);
        throw error;
    }
};

const shutdownTest = async () => {
    console.log('Starting shutdownTest...');
    try {
        await shutdown();
        console.log('RabbitMQ client shutdown successfully');
    } catch (error) {
        console.error('Failed to shutdown RabbitMQ client:', error);
        throw error;
    }
};

(async function main() {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });

    try {
        // Initialize RabbitMQ client
        await initializeQueueTest(RABBITMQ_URL!);

        // Publish a message
        await publishMessageTest();

        // Shutdown the RabbitMQ client
        await shutdownTest();

        console.log("🎉 All integration tests passed");
    } catch (err) {
        console.error("❌ Integration tests failed:", err);
        process.exit(1);
    }
})();