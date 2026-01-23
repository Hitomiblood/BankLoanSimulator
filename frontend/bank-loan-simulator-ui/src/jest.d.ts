/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module '@jest/expect' {
  type Matchers<R = void> = TestingLibraryMatchers<typeof expect.stringContaining, R>;
}

declare global {
  namespace jest {
    type Matchers<R = void> = TestingLibraryMatchers<typeof expect.stringContaining, R>;
  }
}
