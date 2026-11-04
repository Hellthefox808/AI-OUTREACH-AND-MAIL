/**
 * MongoDB connection management.
 *
 * A single connection instance is shared across the backend process. The
 * connection is established once at application bootstrap and closed on
 * graceful shutdown. Frontend and extension must never import this module.
 */

import mongoose from 'mongoose';

let connection: typeof mongoose | null = null;
let isConnecting = false;
let connectPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(uri: string): Promise<typeof mongoose> {
  if (connection) {
    return connection;
  }

  if (connectPromise) {
    return connectPromise;
  }

  isConnecting = true;
  connectPromise = mongoose
    .connect(uri, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    })
    .then(instance => {
      connection = instance;
      isConnecting = false;

      instance.connection.on('disconnected', () => {
        connection = null;
        connectPromise = null;
      });

      instance.connection.on('error', err => {
        // eslint-disable-next-line no-console
        console.error('[mongodb] connection error:', err.message);
      });

      return instance;
    })
    .catch(err => {
      isConnecting = false;
      connectPromise = null;
      throw err;
    });

  return connectPromise;
}

export async function closeDatabase(): Promise<void> {
  if (connection) {
    await connection.disconnect();
    connection = null;
    connectPromise = null;
    isConnecting = false;
  }
}

export { mongoose };
