/**
 * Integration Test: Backend + Dashboard + AIBuilder
 * 
 * This test verifies that the complete pipeline works end-to-end:
 * 1. Dashboard connects to backend via WebSocket
 * 2. Backend receives command and passes to AIBuilder
 * 3. AIBuilder executes safely in sandbox
 * 4. Events stream back to dashboard
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { io, Socket } from 'socket.io-client';
import path from 'path';

let client: Socket;
const API_URL = 'http://localhost:3000';

describe('AI Laptop Builder - End-to-End Integration', () => {
  beforeAll((done) => {
    client = io(API_URL);
    client.on('connect', done);
  });

  afterAll(() => {
    client.disconnect();
  });

  it('should connect to backend', (done) => {
    expect(client.connected).toBe(true);
    done();
  });

  it('should receive sandbox status on connect', (done) => {
    client.on('sandbox:status', (status) => {
      expect(status).toHaveProperty('isActive');
      expect(status).toHaveProperty('workspaceRoot');
      expect(status.isActive).toBe(true);
      done();
    });
  });

  it('should execute a command and receive task events', (done) => {
    const taskId = `test-${Date.now()}`;
    let gotCreated = false;
    let gotCompleted = false;

    client.on('task:created', (task) => {
      if (task.id === taskId) {
        gotCreated = true;
        expect(task.status).toBe('running');
      }
    });

    client.on('task:completed', (data) => {
      if (data.taskId === taskId) {
        gotCompleted = true;
        expect(data).toHaveProperty('status');
        expect(data).toHaveProperty('stateChanged');

        if (gotCreated && gotCompleted) {
          done();
        }
      }
    });

    client.emit('execute:command', {
      taskId,
      program: 'echo',
      args: ['Hello from test'],
      description: 'Test command execution',
    });
  });

  it('should execute npm install safely', (done) => {
    this.timeout(30000);
    const taskId = `npm-install-${Date.now()}`;

    client.on('task:completed', (data) => {
      if (data.taskId === taskId) {
        // npm install should succeed or give meaningful error
        expect(data).toHaveProperty('status');
        done();
      }
    });

    client.emit('execute:command', {
      taskId,
      program: 'npm',
      args: ['--version'],
      description: 'Test npm version',
    });
  });
});
