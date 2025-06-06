import { queueClient } from "@/api/queue";
import { MessageEvent } from "@/models/event";

const publishMessage = async (message: MessageEvent): Promise<void> => {
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



export {
    publishMessage,
};