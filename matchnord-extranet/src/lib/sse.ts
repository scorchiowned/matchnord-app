import { NextRequest } from 'next/server';

export interface SSEConnection {
  id: string;
  controller: ReadableStreamDefaultController;
  lastHeartbeat: number;
}

export class SSEManager {
  private connections = new Map<string, SSEConnection>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  createConnection(req: NextRequest): ReadableStream {
    const connectionId = crypto.randomUUID();

    const stream = new ReadableStream({
      start: (controller) => {
        // Store connection
        this.connections.set(connectionId, {
          id: connectionId,
          controller,
          lastHeartbeat: Date.now(),
        });

        // Send initial connection event
        this.sendToConnection(connectionId, {
          type: 'connected',
          data: { connectionId },
        });

        // Handle connection cleanup
        req.signal.addEventListener('abort', () => {
          this.removeConnection(connectionId);
        });
      },
      cancel: () => {
        this.removeConnection(connectionId);
      },
    });

    return stream;
  }

  sendToConnection(connectionId: string, event: SSEEvent): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    try {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      connection.controller.enqueue(new TextEncoder().encode(data));
      return true;
    } catch (error) {
      console.error(`Failed to send to connection ${connectionId}:`, error);
      this.removeConnection(connectionId);
      return false;
    }
  }

  broadcast(
    event: SSEEvent,
    filter?: (connectionId: string) => boolean
  ): number {
    let sent = 0;
    Array.from(this.connections.keys()).forEach((connectionId) => {
      if (!filter || filter(connectionId)) {
        if (this.sendToConnection(connectionId, event)) {
          sent++;
        }
      }
    });
    return sent;
  }

  broadcastToMatch(_matchId: string, event: SSEEvent): number {
    return this.broadcast(event, () => {
      // In a real implementation, you'd track which connections are subscribed to which matches
      // For now, broadcast to all connections
      return true;
    });
  }

  private removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      try {
        connection.controller.close();
      } catch (error) {
        // Connection might already be closed
      }
      this.connections.delete(connectionId);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const staleConnections: string[] = [];

      Array.from(this.connections.entries()).forEach(
        ([connectionId, connection]) => {
          // Remove connections that haven't responded to heartbeat in 30 seconds
          if (now - connection.lastHeartbeat > 30000) {
            staleConnections.push(connectionId);
          } else {
            // Send heartbeat
            this.sendToConnection(connectionId, {
              type: 'heartbeat',
              data: { timestamp: now },
            });
          }
        }
      );

      // Clean up stale connections
      staleConnections.forEach((id) => this.removeConnection(id));
    }, 10000); // Send heartbeat every 10 seconds
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all connections
    Array.from(this.connections.keys()).forEach((connectionId) => {
      this.removeConnection(connectionId);
    });
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}

export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

// Global SSE manager instance
export const sseManager = new SSEManager();
