import { Message } from '@/models/message';

interface BaseEvent {
    type: string;
    userIds: string[];
};

interface MessageEvent extends BaseEvent {
    type: 'message';
    message: Message;
}

export {
    BaseEvent,
    MessageEvent
};