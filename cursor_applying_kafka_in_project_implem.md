# Applying Kafka in project implementation
_Exported on 1/6/2025 at 13:05:24 GMT+7 from Cursor (0.50.6)_

---

**User**

how to apply kafka in this project , explain detail step, what function should apply kafka?

---

**Cursor**

I'll help you integrate Apache Kafka into your NestJS startup collaboration app. Let me first explore the current project structure to understand the architecture better.

Now I'll provide you with a comprehensive guide on integrating Apache Kafka into your startup collaboration app.

## Apache Kafka Integration for Startup Collaboration App

### Why Use Kafka in This Project?

Kafka is ideal for your startup collaboration app because it provides:

1. **Event-Driven Architecture**: Decouple services and enable reactive programming
2. **Scalability**: Handle high-volume real-time events (messages, notifications, task updates)
3. **Reliability**: Ensure message delivery and fault tolerance
4. **Real-time Analytics**: Stream processing for user activity and metrics
5. **Integration Hub**: Connect external services (Slack, GitHub) seamlessly

### Functions That Should Use Kafka

Based on your project structure, here are the key areas where Kafka will add value:

1. **Chat System**: Real-time message delivery and persistence
2. **Notifications**: User activity notifications and alerts
3. **Task Updates**: Project and task state changes
4. **User Activity**: Analytics and audit logs
5. **External Integrations**: GitHub webhooks, Slack events
6. **File Processing**: Asynchronous file upload processing

## Detailed Implementation Steps

### Step 1: Install Kafka Dependencies

```bash
npm install @nestjs/microservices kafkajs
npm install --save-dev @types/kafkajs
```

### Step 2: Create Kafka Configuration Module

Create `src/core/kafka/kafka.module.ts`:

```typescript:src/core/kafka/kafka.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get('KAFKA_CLIENT_ID', 'startup-collab-app'),
              brokers: configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
              ssl: configService.get('KAFKA_SSL', 'false') === 'true',
              sasl: configService.get('KAFKA_USERNAME') ? {
                mechanism: 'plain',
                username: configService.get('KAFKA_USERNAME'),
                password: configService.get('KAFKA_PASSWORD'),
              } : undefined,
            },
            consumer: {
              groupId: configService.get('KAFKA_GROUP_ID', 'startup-collab-consumer'),
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService, ClientsModule],
})
export class KafkaModule {}
```

### Step 3: Create Kafka Service

Create `src/core/kafka/kafka.service.ts`:

```typescript:src/core/kafka/kafka.service.ts
import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export interface KafkaMessage {
  topic: string;
  partition?: number;
  key?: string;
  value: any;
  headers?: Record<string, string>;
}

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to topics for consumer
    const topics = [
      'chat.messages',
      'notifications.send',
      'tasks.updates',
      'user.activity',
      'files.processing',
      'integrations.github',
      'integrations.slack',
    ];

    topics.forEach(topic => {
      this.kafkaClient.subscribeToResponseOf(topic);
    });

    await this.kafkaClient.connect();
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }

  // Send message to Kafka topic
  async sendMessage(message: KafkaMessage): Promise<void> {
    return this.kafkaClient.send(message.topic, {
      key: message.key,
      value: JSON.stringify(message.value),
      headers: message.headers,
    }).toPromise();
  }

  // Listen to Kafka topic
  listenToTopic<T>(topic: string): Observable<T> {
    return this.kafkaClient.subscribeToResponseOf<T>(topic);
  }

  // Emit event to specific topic
  async emitEvent(topic: string, data: any, key?: string): Promise<void> {
    await this.sendMessage({
      topic,
      key,
      value: data,
      headers: {
        timestamp: new Date().toISOString(),
        source: 'startup-collab-app',
      },
    });
  }
}
```

### Step 4: Create Event Types and DTOs

Create `src/core/kafka/events/index.ts`:

```typescript:src/core/kafka/events/index.ts
// Chat Events
export interface ChatMessageEvent {
  messageId: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'file' | 'image';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Notification Events
export interface NotificationEvent {
  id: string;
  userId: string;
  type: 'chat_message' | 'task_assigned' | 'project_update' | 'mention';
  title: string;
  content: string;
  data?: Record<string, any>;
  timestamp: Date;
}

// Task Events
export interface TaskUpdateEvent {
  taskId: string;
  projectId: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'completed';
  changes?: Record<string, any>;
  timestamp: Date;
}

// User Activity Events
export interface UserActivityEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

// File Processing Events
export interface FileProcessingEvent {
  fileId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  url?: string;
  error?: string;
  timestamp: Date;
}

// GitHub Integration Events
export interface GitHubWebhookEvent {
  repository: string;
  action: string;
  payload: any;
  timestamp: Date;
}

// Slack Integration Events
export interface SlackEvent {
  teamId: string;
  channelId: string;
  userId: string;
  eventType: string;
  data: any;
  timestamp: Date;
}
```

### Step 5: Update Chat Module with Kafka Integration

Create `src/modules/chat/chat-kafka.service.ts`:

```typescript:src/modules/chat/chat-kafka.service.ts
import { Injectable } from '@nestjs/common';
import { KafkaService } from '../../core/kafka/kafka.service';
import { ChatMessageEvent } from '../../core/kafka/events';
import { EventPattern, Payload } from '@nestjs/microservices';

@Injectable()
export class ChatKafkaService {
  constructor(private readonly kafkaService: KafkaService) {}

  // Send chat message event
  async publishMessage(message: ChatMessageEvent): Promise<void> {
    await this.kafkaService.emitEvent(
      'chat.messages',
      message,
      message.chatRoomId,
    );
  }

  // Handle incoming chat messages from Kafka
  @EventPattern('chat.messages')
  async handleChatMessage(@Payload() message: ChatMessageEvent): Promise<void> {
    console.log('Processing chat message:', message);
    
    // Here you can:
    // 1. Store message in database
    // 2. Send real-time updates via WebSocket
    // 3. Trigger notifications
    // 4. Update message analytics
    
    // Example: Trigger notification for mentioned users
    if (message.content.includes('@')) {
      // Extract mentioned users and send notifications
      await this.triggerMentionNotifications(message);
    }
  }

  private async triggerMentionNotifications(message: ChatMessageEvent): Promise<void> {
    // Extract @mentions from message content
    const mentions = this.extractMentions(message.content);
    
    for (const userId of mentions) {
      await this.kafkaService.emitEvent('notifications.send', {
        id: `mention-${message.messageId}-${userId}`,
        userId,
        type: 'mention',
        title: 'You were mentioned in a chat',
        content: message.content,
        data: {
          messageId: message.messageId,
          chatRoomId: message.chatRoomId,
          senderId: message.senderId,
        },
        timestamp: new Date(),
      });
    }
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }
}
```

### Step 6: Create Notification Kafka Service

Create `src/modules/notifications/notification-kafka.service.ts`:

```typescript:src/modules/notifications/notification-kafka.service.ts
import { Injectable } from '@nestjs/common';
import { KafkaService } from '../../core/kafka/kafka.service';
import { NotificationEvent } from '../../core/kafka/events';
import { EventPattern, Payload } from '@nestjs/microservices';

@Injectable()
export class NotificationKafkaService {
  constructor(private readonly kafkaService: KafkaService) {}

  @EventPattern('notifications.send')
  async handleNotification(@Payload() notification: NotificationEvent): Promise<void> {
    console.log('Processing notification:', notification);
    
    try {
      // 1. Store notification in database
      await this.storeNotification(notification);
      
      // 2. Send real-time notification via WebSocket
      await this.sendRealTimeNotification(notification);
      
      // 3. Send email if high priority
      if (this.isHighPriority(notification)) {
        await this.sendEmailNotification(notification);
      }
      
      // 4. Update user notification preferences
      await this.updateNotificationMetrics(notification);
      
    } catch (error) {
      console.error('Error processing notification:', error);
      // Could emit to dead letter queue for retry
    }
  }

  private async storeNotification(notification: NotificationEvent): Promise<void> {
    // Store in database using Prisma
    // Implementation depends on your notification schema
  }

  private async sendRealTimeNotification(notification: NotificationEvent): Promise<void> {
    // Send via WebSocket to connected clients
    // Implementation depends on your WebSocket setup
  }

  private async sendEmailNotification(notification: NotificationEvent): Promise<void> {
    // Send email via your email service
    // Could emit another Kafka event for email processing
    await this.kafkaService.emitEvent('email.send', {
      to: notification.userId,
      subject: notification.title,
      body: notification.content,
      template: 'notification',
      data: notification.data,
    });
  }

  private isHighPriority(notification: NotificationEvent): boolean {
    return ['task_assigned', 'mention', 'project_update'].includes(notification.type);
  }

  private async updateNotificationMetrics(notification: NotificationEvent): Promise<void> {
    // Update analytics and metrics
    await this.kafkaService.emitEvent('user.activity', {
      userId: notification.userId,
      action: 'notification_received',
      resource: 'notification',
      resourceId: notification.id,
      metadata: {
        type: notification.type,
      },
      timestamp: new Date(),
    });
  }
}
```

### Step 7: Create Task Updates Kafka Service

Create `src/modules/tasks/task-kafka.service.ts`:

```typescript:src/modules/tasks/task-kafka.service.ts
import { Injectable } from '@nestjs/common';
import { KafkaService } from '../../core/kafka/kafka.service';
import { TaskUpdateEvent } from '../../core/kafka/events';
import { EventPattern, Payload } from '@nestjs/microservices';

@Injectable()
export class TaskKafkaService {
  constructor(private readonly kafkaService: KafkaService) {}

  // Publish task update event
  async publishTaskUpdate(event: TaskUpdateEvent): Promise<void> {
    await this.kafkaService.emitEvent(
      'tasks.updates',
      event,
      event.taskId,
    );
  }

  @EventPattern('tasks.updates')
  async handleTaskUpdate(@Payload() event: TaskUpdateEvent): Promise<void> {
    console.log('Processing task update:', event);
    
    try {
      // 1. Update real-time UI
      await this.broadcastTaskUpdate(event);
      
      // 2. Send notifications to relevant users
      await this.notifyTaskStakeholders(event);
      
      // 3. Update project analytics
      await this.updateProjectMetrics(event);
      
      // 4. Sync with external services (GitHub, Slack)
      await this.syncWithExternalServices(event);
      
    } catch (error) {
      console.error('Error processing task update:', error);
    }
  }

  private async broadcastTaskUpdate(event: TaskUpdateEvent): Promise<void> {
    // Send WebSocket update to project members
  }

  private async notifyTaskStakeholders(event: TaskUpdateEvent): Promise<void> {
    // Get task assignees, project members, etc.
    // Send notifications based on the action
    
    if (event.action === 'assigned') {
      // Notify the assigned user
      await this.kafkaService.emitEvent('notifications.send', {
        id: `task-assigned-${event.taskId}-${Date.now()}`,
        userId: event.userId, // Assuming userId is the assignee
        type: 'task_assigned',
        title: 'New task assigned to you',
        content: `You have been assigned a new task in project ${event.projectId}`,
        data: {
          taskId: event.taskId,
          projectId: event.projectId,
          action: event.action,
        },
        timestamp: new Date(),
      });
    }
  }

  private async updateProjectMetrics(event: TaskUpdateEvent): Promise<void> {
    // Track project progress, velocity, etc.
    await this.kafkaService.emitEvent('analytics.project', {
      projectId: event.projectId,
      metric: 'task_update',
      value: 1,
      metadata: {
        action: event.action,
        taskId: event.taskId,
      },
      timestamp: new Date(),
    });
  }

  private async syncWithExternalServices(event: TaskUpdateEvent): Promise<void> {
    // Sync with GitHub issues, Slack channels, etc.
    if (event.action === 'completed') {
      await this.kafkaService.emitEvent('integrations.github', {
        action: 'close_issue',
        taskId: event.taskId,
        projectId: event.projectId,
      });
    }
  }
}
```

### Step 8: Update App Module

Update your `src/app.module.ts`:

```typescript:src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfilesModule } from './profiles/profiles.module';
import { SupabaseModule } from './core/supabase/supabase.module';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from './core/config/config.module';
import { KafkaModule } from './core/kafka/kafka.module'; // Add this

@Module({
  imports: [
    ProfilesModule, 
    SupabaseModule, 
    AuthModule, 
    ConfigModule,
    KafkaModule, // Add this
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
  ],
})
export class AppModule {}
```

### Step 9: Environment Configuration

Add to your `.env` file:

```env
# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=startup-collab-app
KAFKA_GROUP_ID=startup-collab-consumer
KAFKA_SSL=false
KAFKA_USERNAME=
KAFKA_PASSWORD=

# For production (Confluent Cloud, AWS MSK, etc.)
# KAFKA_BROKERS=your-cluster.kafka.amazonaws.com:9092
# KAFKA_SSL=true
# KAFKA_USERNAME=your-username
# KAFKA_PASSWORD=your-password
```

### Step 10: Docker Configuration for Local Development

Create `docker-compose.kafka.yml`:

```yaml:docker-compose.kafka.yml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: true

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
```

Start Kafka locally:
```bash
docker-compose -f docker-compose.kafka.yml up -d
```

### Step 11: Testing Kafka Integration

Create a test script `scripts/test-kafka.ts`:

```typescript:scripts/test-kafka.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KafkaService } from '../src/core/kafka/kafka.service';

async function testKafka() {
  const app = await NestFactory.create(AppModule);
  const kafkaService = app.get(KafkaService);

  // Test chat message
  await kafkaService.emitEvent('chat.messages', {
    messageId: 'test-msg-1',
    chatRoomId: 'room-1',
    senderId: 'user-1',
    content: 'Hello @user2, how are you?',
    messageType: 'text',
    timestamp: new Date(),
  });

  // Test task update
  await kafkaService.emitEvent('tasks.updates', {
    taskId: 'task-1',
    projectId: 'project-1',
    userId: 'user-1',
    action: 'completed',
    timestamp: new Date(),
  });

  console.log('Test events sent to Kafka');
  await app.close();
}

testKafka().catch(console.error);
```

### Step 12: Monitoring and Health Checks

Create `src/core/kafka/kafka-health.service.ts`:

```typescript:src/core/kafka/kafka-health.service.ts
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { KafkaService } from './kafka.service';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(private readonly kafkaService: KafkaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Simple health check - try to send a test message
      await this.kafkaService.emitEvent('health.check', {
        timestamp: new Date(),
        service: 'startup-collab-app',
      });

      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Kafka health check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }
}
```

## Production Deployment Considerations

### 1. Managed Kafka Services
- **AWS MSK**: Fully managed Apache Kafka service
- **Confluent Cloud**: Cloud-native Kafka service
- **Azure Event Hubs**: Compatible with Kafka protocol

### 2. Scaling Strategies
- Use partitioning for high-throughput topics
- Configure consumer groups for parallel processing
- Implement circuit breakers for fault tolerance

### 3. Security
- Enable SSL/TLS encryption
- Use SASL authentication
- Implement proper access controls

### 4. Monitoring
- Set up metrics for message throughput
- Monitor consumer lag
- Track error rates and dead letter queues

This Kafka integration provides a robust foundation for event-driven architecture in your startup collaboration app, enabling real-time features, reliable message delivery, and seamless scalability.

```shellscript
npm install @nestjs/microservices kafkajs
npm install --save-dev @types/kafkajs
```

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get('KAFKA_CLIENT_ID', 'startup-collab-app'),
              brokers: configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
              ssl: configService.get('KAFKA_SSL', 'false') === 'true',
              sasl: configService.get('KAFKA_USERNAME') ? {
                mechanism: 'plain',
                username: configService.get('KAFKA_USERNAME'),
                password: configService.get('KAFKA_PASSWORD'),
              } : undefined,
            },
            consumer: {
              groupId: configService.get('KAFKA_GROUP_ID', 'startup-collab-consumer'),
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService, ClientsModule],
})
export class KafkaModule {}
```

```typescript
import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export interface KafkaMessage {
  topic: string;
  partition?: number;
  key?: string;
  value: any;
  headers?: Record<string, string>;
}

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to topics for consumer
    const topics = [
      'chat.messages',
      'notifications.send',
      'tasks.updates',
      'user.activity',
      'files.processing',
      'integrations.github',
      'integrations.slack',
    ];

    topics.forEach(topic => {
      this.kafkaClient.subscribeToResponseOf(topic);
    });

    await this.kafkaClient.connect();
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }

  // Send message to Kafka topic
  async sendMessage(message: KafkaMessage): Promise<void> {
    return this.kafkaClient.send(message.topic, {
      key: message.key,
      value: JSON.stringify(message.value),
      headers: message.headers,
    }).toPromise();
  }

  // Listen to Kafka topic
  listenToTopic<T>(topic: string): Observable<T> {
    return this.kafkaClient.subscribeToResponseOf<T>(topic);
  }

  // Emit event to specific topic
  async emitEvent(topic: string, data: any, key?: string): Promise<void> {
    await this.sendMessage({
      topic,
      key,
      value: data,
      headers: {
        timestamp: new Date().toISOString(),
        source: 'startup-collab-app',
      },
    });
  }
}
```

```typescript
// Chat Events
export interface ChatMessageEvent {
  messageId: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'file' | 'image';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Notification Events
export interface NotificationEvent {
  id: string;
  userId: string;
  type: 'chat_message' | 'task_assigned' | 'project_update' | 'mention';
  title: string;
  content: string;
  data?: Record<string, any>;
  timestamp: Date;
}

// Task Events
export interface TaskUpdateEvent {
  taskId: string;
  projectId: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'completed';
  changes?: Record<string, any>;
  timestamp: Date;
}

// User Activity Events
export interface UserActivityEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

// File Processing Events
export interface FileProcessingEvent {
  fileId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  url?: string;
  error?: string;
  timestamp: Date;
}

// GitHub Integration Events
export interface GitHubWebhookEvent {
  repository: string;
  action: string;
  payload: any;
  timestamp: Date;
}

// Slack Integration Events
export interface SlackEvent {
  teamId: string;
  channelId: string;
  userId: string;
  eventType: string;
  data: any;
  timestamp: Date;
}
```

```typescript
import { Injectable } from '@nestjs/common';
import { KafkaService } from '../../core/kafka/kafka.service';
import { ChatMessageEvent } from '../../core/kafka/events';
import { EventPattern, Payload } from '@nestjs/microservices';

@Injectable()
export class ChatKafkaService {
  constructor(private readonly kafkaService: KafkaService) {}

  // Send chat message event
  async publishMessage(message: ChatMessageEvent): Promise<void> {
    await this.kafkaService.emitEvent(
      'chat.messages',
      message,
      message.chatRoomId,
    );
  }

  // Handle incoming chat messages from Kafka
  @EventPattern('chat.messages')
  async handleChatMessage(@Payload() message: ChatMessageEvent): Promise<void> {
    console.log('Processing chat message:', message);
    
    // Here you can:
    // 1. Store message in database
    // 2. Send real-time updates via WebSocket
    // 3. Trigger notifications
    // 4. Update message analytics
    
    // Example: Trigger notification for mentioned users
    if (message.content.includes('@')) {
      // Extract mentioned users and send notifications
      await this.triggerMentionNotifications(message);
    }
  }

  private async triggerMentionNotifications(message: ChatMessageEvent): Promise<void> {
    // Extract @mentions from message content
    const mentions = this.extractMentions(message.content);
    
    for (const userId of mentions) {
      await this.kafkaService.emitEvent('notifications.send', {
        id: `mention-${message.messageId}-${userId}`,
        userId,
        type: 'mention',
        title: 'You were mentioned in a chat',
        content: message.content,
        data: {
          messageId: message.messageId,
          chatRoomId: message.chatRoomId,
          senderId: message.senderId,
        },
        timestamp: new Date(),
      });
    }
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }
}
```

```typescript
import { Injectable } from '@nestjs/common';
import { KafkaService } from '../../core/kafka/kafka.service';
import { NotificationEvent } from '../../core/kafka/events';
import { EventPattern, Payload } from '@nestjs/microservices';

@Injectable()
export class NotificationKafkaService {
  constructor(private readonly kafkaService: KafkaService) {}

  @EventPattern('notifications.send')
  async handleNotification(@Payload() notification: NotificationEvent): Promise<void> {
    console.log('Processing notification:', notification);
    
    try {
      // 1. Store notification in database
      await this.storeNotification(notification);
      
      // 2. Send real-time notification via WebSocket
      await this.sendRealTimeNotification(notification);
      
      // 3. Send email if high priority
      if (this.isHighPriority(notification)) {
        await this.sendEmailNotification(notification);
      }
      
      // 4. Update user notification preferences
      await this.updateNotificationMetrics(notification);
      
    } catch (error) {
      console.error('Error processing notification:', error);
      // Could emit to dead letter queue for retry
    }
  }

  private async storeNotification(notification: NotificationEvent): Promise<void> {
    // Store in database using Prisma
    // Implementation depends on your notification schema
  }

  private async sendRealTimeNotification(notification: NotificationEvent): Promise<void> {
    // Send via WebSocket to connected clients
    // Implementation depends on your WebSocket setup
  }

  private async sendEmailNotification(notification: NotificationEvent): Promise<void> {
    // Send email via your email service
    // Could emit another Kafka event for email processing
    await this.kafkaService.emitEvent('email.send', {
      to: notification.userId,
      subject: notification.title,
      body: notification.content,
      template: 'notification',
      data: notification.data,
    });
  }

  private isHighPriority(notification: NotificationEvent): boolean {
    return ['task_assigned', 'mention', 'project_update'].includes(notification.type);
  }

  private async updateNotificationMetrics(notification: NotificationEvent): Promise<void> {
    // Update analytics and metrics
    await this.kafkaService.emitEvent('user.activity', {
      userId: notification.userId,
      action: 'notification_received',
      resource: 'notification',
      resourceId: notification.id,
      metadata: {
        type: notification.type,
      },
      timestamp: new Date(),
    });
  }
}
```

```typescript
import { Injectable } from '@nestjs/common';
import { KafkaService } from '../../core/kafka/kafka.service';
import { TaskUpdateEvent } from '../../core/kafka/events';
import { EventPattern, Payload } from '@nestjs/microservices';

@Injectable()
export class TaskKafkaService {
  constructor(private readonly kafkaService: KafkaService) {}

  // Publish task update event
  async publishTaskUpdate(event: TaskUpdateEvent): Promise<void> {
    await this.kafkaService.emitEvent(
      'tasks.updates',
      event,
      event.taskId,
    );
  }

  @EventPattern('tasks.updates')
  async handleTaskUpdate(@Payload() event: TaskUpdateEvent): Promise<void> {
    console.log('Processing task update:', event);
    
    try {
      // 1. Update real-time UI
      await this.broadcastTaskUpdate(event);
      
      // 2. Send notifications to relevant users
      await this.notifyTaskStakeholders(event);
      
      // 3. Update project analytics
      await this.updateProjectMetrics(event);
      
      // 4. Sync with external services (GitHub, Slack)
      await this.syncWithExternalServices(event);
      
    } catch (error) {
      console.error('Error processing task update:', error);
    }
  }

  private async broadcastTaskUpdate(event: TaskUpdateEvent): Promise<void> {
    // Send WebSocket update to project members
  }

  private async notifyTaskStakeholders(event: TaskUpdateEvent): Promise<void> {
    // Get task assignees, project members, etc.
    // Send notifications based on the action
    
    if (event.action === 'assigned') {
      // Notify the assigned user
      await this.kafkaService.emitEvent('notifications.send', {
        id: `task-assigned-${event.taskId}-${Date.now()}`,
        userId: event.userId, // Assuming userId is the assignee
        type: 'task_assigned',
        title: 'New task assigned to you',
        content: `You have been assigned a new task in project ${event.projectId}`,
        data: {
          taskId: event.taskId,
          projectId: event.projectId,
          action: event.action,
        },
        timestamp: new Date(),
      });
    }
  }

  private async updateProjectMetrics(event: TaskUpdateEvent): Promise<void> {
    // Track project progress, velocity, etc.
    await this.kafkaService.emitEvent('analytics.project', {
      projectId: event.projectId,
      metric: 'task_update',
      value: 1,
      metadata: {
        action: event.action,
        taskId: event.taskId,
      },
      timestamp: new Date(),
    });
  }

  private async syncWithExternalServices(event: TaskUpdateEvent): Promise<void> {
    // Sync with GitHub issues, Slack channels, etc.
    if (event.action === 'completed') {
      await this.kafkaService.emitEvent('integrations.github', {
        action: 'close_issue',
        taskId: event.taskId,
        projectId: event.projectId,
      });
    }
  }
}
```

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfilesModule } from './profiles/profiles.module';
import { SupabaseModule } from './core/supabase/supabase.module';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from './core/config/config.module';
import { KafkaModule } from './core/kafka/kafka.module'; // Add this

@Module({
  imports: [
    ProfilesModule, 
    SupabaseModule, 
    AuthModule, 
    ConfigModule,
    KafkaModule, // Add this
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
  ],
})
export class AppModule {}
```

```dotenv
# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=startup-collab-app
KAFKA_GROUP_ID=startup-collab-consumer
KAFKA_SSL=false
KAFKA_USERNAME=
KAFKA_PASSWORD=

# For production (Confluent Cloud, AWS MSK, etc.)
# KAFKA_BROKERS=your-cluster.kafka.amazonaws.com:9092
# KAFKA_SSL=true
# KAFKA_USERNAME=your-username
# KAFKA_PASSWORD=your-password
```

```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: true

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
```

```shellscript
docker-compose -f docker-compose.kafka.yml up -d
```

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KafkaService } from '../src/core/kafka/kafka.service';

async function testKafka() {
  const app = await NestFactory.create(AppModule);
  const kafkaService = app.get(KafkaService);

  // Test chat message
  await kafkaService.emitEvent('chat.messages', {
    messageId: 'test-msg-1',
    chatRoomId: 'room-1',
    senderId: 'user-1',
    content: 'Hello @user2, how are you?',
    messageType: 'text',
    timestamp: new Date(),
  });

  // Test task update
  await kafkaService.emitEvent('tasks.updates', {
    taskId: 'task-1',
    projectId: 'project-1',
    userId: 'user-1',
    action: 'completed',
    timestamp: new Date(),
  });

  console.log('Test events sent to Kafka');
  await app.close();
}

testKafka().catch(console.error);
```

```typescript
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { KafkaService } from './kafka.service';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(private readonly kafkaService: KafkaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Simple health check - try to send a test message
      await this.kafkaService.emitEvent('health.check', {
        timestamp: new Date(),
        service: 'startup-collab-app',
      });

      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Kafka health check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }
}
```

