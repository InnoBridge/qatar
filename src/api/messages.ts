import { queueClient } from "@/api/queue";
import { Message } from "@/models/message";

const publishMessage = async (message: Message): Promise<void> => {
    if (!queueClient) {
        throw new Error('Queue client not initialized. Call initializeQueue first.');
    }
    
    try {
        await queueClient.publishMessage(message);
        console.log('Message published successfully');
    } catch (error) {
        console.error('Failed to publish message:', error);
        throw error;
    }
};

const subscribeUser = async (userId: string, callback: (message: Message) => void): Promise<void> => {
    if (!queueClient) {
        throw new Error('Queue client not initialized. Call initializeQueue first.');
    }

    try {
        await queueClient.subscribeUser(userId, callback);
        console.log(`Subscribed to user queue ${userId} successfully`);
    } catch (error) {
        console.error(`Failed to subscribe to user queue ${userId}:`, error);
        throw error;
    }
};

export {
    publishMessage,
    subscribeUser,
};