import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  // setupFiles run inside the test environment vm context BEFORE any test code,
  // allowing us to inject missing Web Fetch API globals (Request, Response, etc.)
  // that next/server requires but jest-environment-jsdom omits.
  setupFiles: ['<rootDir>/jest.setup.node-fetch-globals.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
    // bad-words and badwords-list are ESM-only packages; transform them with ts-jest
    '^.+\\.js$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        allowJs: true,
      },
    }],
  },
  // Override default transformIgnorePatterns to allow ESM packages to be transformed
  transformIgnorePatterns: [
    '/node_modules/(?!(bad-words|badwords-list)/)',
  ],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
}

export default config
