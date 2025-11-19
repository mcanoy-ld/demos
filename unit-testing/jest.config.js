module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts', '**/*.test-*.ts'],
  collectCoverageFrom: [
    '*.ts',
    '!*.test.ts',
    '!*.test-*.ts',
    '!*.config.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};

