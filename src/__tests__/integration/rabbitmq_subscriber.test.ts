import * as dotenv from 'dotenv';
import path from 'path';
import { RabbitMQClient } from '@/queue/rabbitmq_client';
import { QueueClient } from '@/queue/queue_client';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const userId = process.argv[2] || 'default-user-123';

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

const subscribeToUserQueue = async (client: QueueClient, userId: string): Promise<void> => {
    console.log(`Subscribing to user queue for userId: ${userId}`);
    try {
        await client.subscribeUser(userId, (message, ack, nack) => {
            console.log(`Received message for user ${userId}:`, JSON.stringify(message, null, 2));
            try {
                // Process the message here
                console.log('Processing message...');
                
                // ✅ Acknowledge successful processing
                ack();
                console.log(`✅ Message acknowledged for user ${userId}`);
            } catch (error) {
                console.error(`❌ Error processing message:`, error);
                
                // ❌ Negative acknowledge - requeue the message
                nack();
                console.log(`❌ Message negative acknowledged for user ${userId}`);
            }
        });
        console.log(`Subscribed to user queue ${userId} successfully`);
    } catch (error) {
        console.error(`Failed to subscribe to user queue ${userId}:`, error);
        throw error;
    }
}

const subscribeToUserQueueWithScheduleBinding = async (
    client: QueueClient, 
    providerId: string,
    subscriberId: string
): Promise<void> => {
    console.log(`Subscribing to user queue for providerId: ${providerId}, subscriberId: ${subscriberId}`);
    try {
        await client.bindSubscriberToSchedule(providerId, subscriberId);
        await client.subscribeUser(subscriberId, (message, ack, nack) => {
            console.log(`Received schedule message for provider ${providerId} and subscriber ${subscriberId}:`, JSON.stringify(message, null, 2));
            try {
                // Process the schedule message here
                console.log('Processing schedule message...');
                
                // ✅ Acknowledge successful processing
                ack();
                console.log(`✅ Schedule message acknowledged for provider ${providerId} and subscriber ${subscriberId}`);
            } catch (error) {
                console.error(`❌ Error processing schedule message:`, error);
                
                // ❌ Negative acknowledge - requeue the message
                nack();
                console.log(`❌ Schedule message negative acknowledged for provider ${providerId} and subscriber ${subscriberId}`);
            }
        });
        console.log(`Subscribed to schedule for provider ${providerId} and subscriber ${subscriberId} successfully`);
    } catch (error) {
        console.error(`Failed to subscribe to schedule for provider ${providerId} and subscriber ${subscriberId}:`, error);
        await client.unbindSubscriberToSchedule(providerId, subscriberId);
        throw error;
    }
};

(async function main() {
    try {
        const client = await initializationClient(RABBITMQ_URL!);
        
        // await subscribeToUserQueue(client, userId);
        // await subscribeToUserQueueWithScheduleBinding(client, '123', userId);
        await client.unbindSubscriberToSchedule('123', userId);
        
        // setTimeout(async () => {
        //     console.log('Closing connection channel after delay...');
        //     await client.unsubscribeUser(userId);
        // }, 5000);

        console.log("🎉 RabbitMQ Subscriber integration test passed");
    } catch (err) {
        console.error("❌ RabbitMQ Subscriber integration test failed:", err);
        process.exit(1);
    }
})();
