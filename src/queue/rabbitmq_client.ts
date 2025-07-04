import amqp from 'amqplib';
import { QueueClient } from '@/queue/queue_client';
import { BaseEvent } from '@/models/event';

class RabbitMQClient implements QueueClient {
    private connection: amqp.ChannelModel | null = null;
    private publishingChannel: amqp.Channel | null = null;
    private userMessageChannels: Map<string, amqp.Channel> = new Map();

    private readonly DIRECT_EXCHANGE_TYPE = 'direct';
    private readonly MESSAGE_EXCHANGE = 'message';
    private readonly USER_QUEUE_PREFIX = 'user-';

    constructor() {}

    async initializeQueue(url: string): Promise<void> {
        try {
            console.log('Initializing RabbitMQ connection...');
            this.connection = await amqp.connect(url);
            this.publishingChannel = await this.connection.createChannel();
            
            // Create message exchange
            await this.publishingChannel.assertExchange(
                this.MESSAGE_EXCHANGE, 
                this.DIRECT_EXCHANGE_TYPE
                , { durable: true }
            );

            // Setup error handlers
            this.connection.on('error', (err) => {
                console.error('RabbitMQ connection error:', err);
                this.connection = null;
                this.publishingChannel = null;
            });

            this.connection.on('close', () => {
                console.log('RabbitMQ connection closed');
                this.connection = null;
                this.publishingChannel = null;
            });

            console.log('RabbitMQ initialized successfully');
        } catch (error) {
            console.error('Failed to initialize RabbitMQ:', error);
            throw error;
        }
    }

    async publishEvent(event: BaseEvent): Promise<void> {
        if (!this.publishingChannel) {
            throw new Error('RabbitMQ publishing channel not initialized. Call initializeQueue first.');
        }

        try {
            const messageBuffer = Buffer.from(JSON.stringify(event));
            for (const userId of event.userIds) {
                const queueName = `${this.USER_QUEUE_PREFIX}${userId}`;
                await this.publishingChannel.assertQueue(queueName, { durable: true });
                await this.publishingChannel.bindQueue(
                    queueName, 
                    this.MESSAGE_EXCHANGE, 
                    queueName
                );
                const published = await this.publishingChannel.publish(
                    this.MESSAGE_EXCHANGE,
                    queueName,
                    messageBuffer,
                    { persistent: true }
                );
                if (!published) {
	                console.warn(`Message could not be sent to queue ${queueName} due to buffer overflow.`);
	            } else {
	                 console.log(`Message sent to queue ${queueName}:`);
	            }            
            }
        } catch (error) {
            console.error('Failed to publish message:', error);
            throw error;
        }
    }

    async subscribeUser(userId: string, eventHandler: (event: BaseEvent, ack: () => void, nack: () => void) => void): Promise<void> {
        if (!this.connection) {
            throw new Error('RabbitMQ connection not initialized. Call initializeQueue first.');
        }
        try {
            if (!this.userMessageChannels.has(userId)) {
                this.userMessageChannels.set(
                    userId, 
                    await this.connection.createChannel()
                );
            }
            const channel = this.userMessageChannels.get(userId)!;
            const queueName = `${this.USER_QUEUE_PREFIX}${userId}`;
            await channel.assertQueue(queueName, { durable: true });
            await channel.consume(queueName, (event) => {
                try {
                    const messageContent = JSON.parse(event!.content.toString());
                    console.log(`📬 Message received for ${queueName}:`);
                
                    // Pass ACK/NACK functions to the event handler
                    const ack = () => {
                        channel.ack(event!);
                        console.log(`✅ Message acknowledged for ${queueName}`);
                    };
                    
                    const nack = () => {
                        channel.nack(event!, false, true); // Requeue the message
                        console.log(`❌ Message negative acknowledged for ${queueName}`);
                    };
                    
                    // Call event handler with ACK/NACK functions
                    eventHandler(messageContent, ack, nack);
                } catch (error) {
                    console.error(`❌ Error processing message:`, error);
                    channel.nack(event!, false, false);
                }
            }, { noAck: false });
        
        const queueInfo = await channel.checkQueue(queueName);

        if (queueInfo.consumerCount === 0) {
            throw new Error(`❌ Consumer not registered for ${queueName}`);
        }
        
        console.log(`🎉 Consumer for user ${userId} is ACTIVE and ready`);
        } catch (error) {
            console.error(`❌ Failed to subscribe user ${userId}:`, error);
            throw error;
        }
    }

    

    async unsubscribeUser(userId: string): Promise<void> {
        const channel = this.userMessageChannels.get(userId);
        if (channel) {
            try {
                await channel.close();
                this.userMessageChannels.delete(userId);
                console.log(`❌ User ${userId} unsubscribed`);
            } catch (error) {
                console.error(`Error unsubscribing user ${userId}:`, error);
                throw error;
            }
        }
    }

    async removeQueue(queueName: string): Promise<void> {
        if (!this.publishingChannel) {
            throw new Error('RabbitMQ publishing channel not initialized. Call initializeQueue first.');
        }

        try {
            await this.publishingChannel.deleteQueue(queueName);
            console.log(`Queue ${queueName} deleted successfully`);
        } catch (error) {
            console.error(`Failed to delete queue ${queueName}:`, error);
            throw error;
        }
    }

    async removeExchange(exchangeName: string): Promise<void> {
        if (!this.publishingChannel) {
            throw new Error('RabbitMQ publishing channel not initialized. Call initializeQueue first.');
        }

        try {
            await this.publishingChannel.deleteExchange(exchangeName);
            console.log(`Exchange ${exchangeName} deleted successfully`);
        } catch (error) {
            console.error(`Failed to delete exchange ${exchangeName}:`, error);
            throw error;
        }
    }

    async shutdown(): Promise<void> {
        console.log('Shutting down RabbitMQ client...');
        
        const closePromises: Promise<void>[] = [];

        this.userMessageChannels.forEach((channel, userId) => {
            const closePromise = channel.close()
                .then(() => {
                    this.userMessageChannels.delete(userId);
                    console.log(`Closed channel for user ${userId}`);
                })
                .catch(error => {
                    console.error(`Error closing channel for user ${userId}:`, error);
                });
            closePromises.push(closePromise);
        });
        
        await Promise.allSettled(closePromises);
        this.userMessageChannels.clear();
        
        if (this.publishingChannel) {
            try {
                await this.publishingChannel.close();
                console.log('Publishing channel closed');
            } catch (error) {
                console.error('Error closing publishing channel:', error);
            }
        }
        
        if (this.connection) {
            try {
                await this.connection.close();
                console.log('Connection closed');
            } catch (error) {
                console.error('Error closing connection:', error);
            }
        }
        
        this.connection = null;
        this.publishingChannel = null;
        
        console.log('RabbitMQ client shutdown complete');
    }
}

export {
    RabbitMQClient
};