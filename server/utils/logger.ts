import fs from 'fs';
import path from 'path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 200;

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
  }

  private addLog(level: 'info' | 'warn' | 'error', message: string) {
    const timestamp = new Date().toISOString();
    const formatted = this.formatMessage(level, message);
    
    // Print to console
    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    // Keep in list for dashboard inspection
    this.logs.push({ timestamp, level, message });
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  info(message: string) {
    this.addLog('info', message);
  }

  warn(message: string) {
    this.addLog('warn', message);
  }

  error(message: string) {
    this.addLog('error', message);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
