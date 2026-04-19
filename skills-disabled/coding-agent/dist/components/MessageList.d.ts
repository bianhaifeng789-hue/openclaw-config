import React from 'react';
interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    type?: 'text' | 'tool' | 'error';
}
interface MessageListProps {
    messages: Message[];
}
export declare const MessageList: React.FC<MessageListProps>;
export {};
//# sourceMappingURL=MessageList.d.ts.map