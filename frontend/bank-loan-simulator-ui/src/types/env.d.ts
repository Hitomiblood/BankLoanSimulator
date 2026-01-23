/// <reference types="vite/client" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }

  var process: {
    env: {
      NODE_ENV: 'development' | 'production' | 'test';
    };
  };
}

export {};
