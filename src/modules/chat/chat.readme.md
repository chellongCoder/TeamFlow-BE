
### Core Components

- **WebSocket Gateway**: Handles real-time connections and message broadcasting
- **Chat Service**: Business logic for message handling and conversation management
- **Security Layer**: Authentication, authorization, and input validation
- **Database Layer**: Persistent storage with encryption
- **Caching Layer**: Redis for rate limiting and session management

## Database Schema

### 1. Conversations Table
Stores conversation metadata and settings.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group', 'channel')),
  name VARCHAR(100),                    -- Group/channel name (null for direct)
  description TEXT,                     -- Group/channel description
  avatar_url TEXT,                      -- Group/channel avatar
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,       -- Soft delete flag
  max_participants INTEGER DEFAULT 100, -- Limit for group size
  settings JSONB DEFAULT '{}'::jsonb    -- Custom settings (notifications, etc.)
);
```

**Key Features:**
- Supports multiple conversation types (direct, group, channel)
- Flexible settings storage with JSONB
- Soft delete capability
- Participant limits for scalability

### 2. Conversation Participants Table
Manages user membership and permissions in conversations.

```sql
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- For unread count
  is_muted BOOLEAN DEFAULT false,       -- User-specific mute setting
  UNIQUE(conversation_id, user_id)      -- Prevent duplicate memberships
);
```

**Key Features:**
- Role-based permissions (admin, moderator, member)
- Read receipts tracking
- Individual mute settings
- Prevents duplicate memberships

### 3. Messages Table
Stores all chat messages with metadata.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  content TEXT,                         -- Encrypted message content
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  metadata JSONB DEFAULT '{}'::jsonb,   -- File info, dimensions, etc.
  reply_to_id UUID REFERENCES messages(id), -- For threaded conversations
  is_edited BOOLEAN DEFAULT false,      -- Edit tracking
  is_deleted BOOLEAN DEFAULT false,     -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- Multiple message types (text, image, file, system)
- Reply/thread support
- Edit and delete tracking
- Encrypted content storage
- Flexible metadata for attachments

### 4. Message Reactions Table
Handles emoji reactions to messages.

```sql
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  emoji VARCHAR(10) NOT NULL,           -- Unicode emoji
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)    -- One reaction per user per emoji
);
```

**Key Features:**
- Unicode emoji support
- Prevents duplicate reactions
- Efficient querying for reaction counts

## Security Features

### 1. Authentication & Authorization

#### WebSocket Authentication
```typescript
// JWT token validation for WebSocket connections
@Injectable()
export class WsJwtGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromHandshake(client);
    
    // Validate token with Supabase
    const { data, error } = await this.supabaseService.client.auth.getUser(token);
    
    if (error || !data.user) return false;
    
    client.data.user = data.user; // Attach user to socket
    return true;
  }
}
```

#### Conversation Access Control
```typescript
async verifyConversationAccess(userId: string, conversationId: string): Promise<boolean> {
  const participant = await this.prisma.conversation_participants.findUnique({
    where: {
      conversation_id_user_id: {
        conversation_id: conversationId,
        user_id: userId,
      },
    },
  });
  return !!participant;
}
```

### 2. Rate Limiting

Prevents spam and abuse with Redis-based rate limiting:

```typescript
@Injectable()
export class RateLimiterService {
  async checkLimit(key: string, limit: number, windowInSeconds: number): Promise<boolean> {
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, windowInSeconds);
    }
    return current <= limit;
  }
}
```

**Rate Limits:**
- Messages: 10 per minute per user
- Connections: 5 per minute per IP
- File uploads: 3 per minute per user

### 3. Input Sanitization

Prevents XSS and injection attacks:

```typescript
async sanitizeMessage(content: string): Promise<string> {
  // Remove HTML tags and malicious content
  const sanitized = DOMPurify.sanitize(content, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
  
  // Additional profanity filter
  return this.profanityFilter.clean(sanitized.trim());
}
```

### 4. Message Encryption

End-to-end encryption for message content:

```typescript
async createMessage(data: CreateMessageData) {
  // Encrypt message content before storing
  const encryptedContent = await this.encryptionService.encrypt(data.content);
  
  return this.prisma.messages.create({
    data: {
      ...data,
      content: encryptedContent,
    },
  });
}
```

## Implementation Steps

### Step 1: Install Dependencies

```bash
# Core dependencies
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install @nestjs/passport passport passport-jwt
npm install class-validator class-transformer

# Security dependencies
npm install isomorphic-dompurify crypto-js
npm install ioredis @types/ioredis

# Optional: Profanity filter
npm install bad-words
```

### Step 2: Database Setup

1. **Create tables in Supabase:**
   ```sql
   -- Run the SQL schema provided above in Supabase SQL editor
   ```

2. **Update Prisma schema:**
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

### Step 3: Environment Configuration

```env
# .env file
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Redis for rate limiting
REDIS_URL=redis://localhost:6379

# Encryption key
ENCRYPTION_KEY=your_32_character_encryption_key

# CORS settings
CORS_ORIGIN=http://localhost:3000
```

### Step 4: Create Core Services

1. **Encryption Service:**
   ```typescript
   @Injectable()
   export class EncryptionService {
     private algorithm = 'aes-256-gcm';
     private key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
     
     async encrypt(text: string): Promise<string> {
       const iv = crypto.randomBytes(16);
       const cipher = crypto.createCipher(this.algorithm, this.key);
       // Implementation details...
     }
   }
   ```

2. **Rate Limiter Service:** (See security section above)

### Step 5: Implement WebSocket Gateway

```typescript
@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN, credentials: true },
  namespace: '/chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // Implementation as shown in architecture section
}
```

### Step 6: Create Chat Service

```typescript
@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaClient,
    private encryptionService: EncryptionService,
    private rateLimiter: RateLimiterService,
  ) {}
  
  // Implementation as shown in architecture section
}
```

### Step 7: Set Up Module

```typescript
@Module({
  imports: [
    SupabaseModule,
    ConfigModule,
  ],
  providers: [
    ChatGateway,
    ChatService,
    EncryptionService,
    RateLimiterService,
    WsJwtGuard,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
```

## API Documentation

### WebSocket Events

#### Client → Server Events

| Event | Description | Payload | Response |
|-------|-------------|---------|----------|
| `join_conversation` | Join a conversation room | `{ conversationId: string }` | Success/Error |
| `send_message` | Send a new message | `CreateMessageDto` | Broadcast to room |
| `typing_start` | Indicate user is typing | `{ conversationId: string }` | Broadcast to others |
| `typing_stop` | Stop typing indicator | `{ conversationId: string }` | Broadcast to others |

#### Server → Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `new_message` | New message received | `MessageDto` |
| `user_typing` | User typing status | `{ userId: string, isTyping: boolean }` |
| `user_joined` | User joined conversation | `{ userId: string, conversationId: string }` |
| `user_left` | User left conversation | `{ userId: string, conversationId: string }` |
| `error` | Error occurred | `{ message: string, code?: string }` |

### REST API Endpoints

```typescript
// Get conversation messages
GET /chat/conversations/:id/messages?limit=50&offset=0

// Create new conversation
POST /chat/conversations
Body: { type: 'direct'|'group', participants: string[], name?: string }

// Get user conversations
GET /chat/conversations

// Add participant to conversation
POST /chat/conversations/:id/participants
Body: { userId: string, role?: 'member'|'moderator'|'admin' }

// Update message (edit)
PATCH /chat/messages/:id
Body: { content: string }

// Delete message
DELETE /chat/messages/:id
```

## Client Integration

### React/TypeScript Example

```typescript
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    email: string;
  };
}

class ChatClient {
  private socket: Socket;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.connect();
  }

  private connect() {
    this.socket = io('/chat', {
      auth: { token: this.token },
      transports: ['websocket'],
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('new_message', (message: Message) => {
      this.handleNewMessage(message);
    });

    this.socket.on('user_typing', ({ userId, isTyping }) => {
      this.handleTypingStatus(userId, isTyping);
    });

    this.socket.on('error', (error) => {
      console.error('Chat error:', error);
    });
  }

  // Public methods
  joinConversation(conversationId: string) {
    this.socket.emit('join_conversation', { conversationId });
  }

  sendMessage(conversationId: string, content: string) {
    this.socket.emit('send_message', {
      conversationId,
      content,
      messageType: 'text',
    });
  }

  startTyping(conversationId: string) {
    this.socket.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.socket.emit('typing_stop', { conversationId });
  }

  disconnect() {
    this.socket.disconnect();
  }

  // Event handlers (implement based on your UI framework)
  private handleNewMessage(message: Message) {
    // Update UI with new message
  }

  private handleTypingStatus(userId: string, isTyping: boolean) {
    // Show/hide typing indicator
  }
}
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';

export const useChat = (token: string) => {
  const [chatClient, setChatClient] = useState<ChatClient | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token) {
      const client = new ChatClient(token);
      setChatClient(client);

      // Setup message handler
      client.onNewMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
      };

      client.onConnect = () => setIsConnected(true);
      client.onDisconnect = () => setIsConnected(false);

      return () => client.disconnect();
    }
  }, [token]);

  return {
    chatClient,
    messages,
    isConnected,
    sendMessage: chatClient?.sendMessage.bind(chatClient),
    joinConversation: chatClient?.joinConversation.bind(chatClient),
  };
};
```

## Configuration

### Environment Variables

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Optional
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=your_32_character_encryption_key
CORS_ORIGIN=http://localhost:3000
MAX_MESSAGE_LENGTH=1000
RATE_LIMIT_MESSAGES_PER_MINUTE=10
RATE_LIMIT_CONNECTIONS_PER_MINUTE=5
```

### Redis Configuration

```typescript
// redis.config.ts
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};
```

## Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### Production Considerations

1. **Load Balancing**: Use sticky sessions for WebSocket connections
2. **Scaling**: Implement Redis adapter for multi-instance Socket.IO
3. **Monitoring**: Add health checks and metrics collection
4. **Logging**: Implement structured logging for debugging
5. **Security**: Use HTTPS/WSS in production
6. **Backup**: Regular database backups and point-in-time recovery

### Performance Optimization

1. **Database Indexing**:
   ```sql
   CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
   CREATE INDEX idx_participants_user_conversation ON conversation_participants(user_id, conversation_id);
   ```

2. **Caching Strategy**:
   - Cache recent messages in Redis
   - Cache user conversation lists
   - Cache online user status

3. **Message Pagination**:
   - Implement cursor-based pagination
   - Load messages on-demand
   - Implement virtual scrolling for large conversations

This comprehensive chat system provides enterprise-level security, scalability, and real-time performance suitable for production applications.