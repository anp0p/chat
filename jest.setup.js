// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, WritableStream } from 'stream/web';

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Web Streams
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;

// Mock TransformStream
global.TransformStream = class TransformStream {
  constructor() {
    return {
      readable: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        }
      }),
      writable: new WritableStream({
        write(chunk) {
          // Mock write implementation
        }
      })
    };
  }
};

// Mock Request
global.Request = class Request {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return null;
  }
};

// Mock Response
global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Headers(init?.headers);
    this._bodyInit = body;
  }

  async json() {
    if (typeof this._bodyInit === 'string') {
      return JSON.parse(this._bodyInit);
    }
    return null;
  }

  get body() {
    return {
      getReader: () => ({
        read: async () => ({ done: true, value: undefined })
      })
    };
  }

  set body(value) {
    this._bodyInit = value;
  }
};

// Mock Headers
global.Headers = class Headers {
  constructor(init) {
    this.headers = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value);
      });
    }
  }

  get(name) {
    return this.headers.get(name.toLowerCase()) || null;
  }

  set(name, value) {
    this.headers.set(name.toLowerCase(), value);
  }
}; 