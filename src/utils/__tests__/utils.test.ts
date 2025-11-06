import { getErrorMessage, onlyLettersAndNumbers } from '../utils';

describe('getErrorMessage', () => {
  it('should return the message of an Error object', () => {
    const error = new Error('Test error message');
    expect(getErrorMessage(error)).toBe('Test error message');
  });

  it('should convert non-Error objects to string', () => {
    expect(getErrorMessage('Just a string')).toBe('Just a string');
    expect(getErrorMessage(42)).toBe('42');
    expect(getErrorMessage(null)).toBe('null');
    expect(getErrorMessage(undefined)).toBe('undefined');
    expect(getErrorMessage({ custom: 'object' })).toBe('[object Object]');
  });
});

describe('onlyLettersAndNumbers', () => {
  it('should return true for strings with only letters and numbers', () => {
    expect(onlyLettersAndNumbers('abc123')).toBe(true);
    expect(onlyLettersAndNumbers('ABC123')).toBe(true);
    expect(onlyLettersAndNumbers('')).toBe(true);
  });

  it('should return false for strings with special characters', () => {
    expect(onlyLettersAndNumbers('abc-123')).toBe(false);
    expect(onlyLettersAndNumbers('hello world')).toBe(false);
    expect(onlyLettersAndNumbers('test@example.com')).toBe(false);
    expect(onlyLettersAndNumbers('123_456')).toBe(false);
  });
});
