import { describe, expect, it } from 'vitest';
import { formatTime12 } from './time-12.pipe';

describe('formatTime12', () => {
  it('converts 24-hour record times to AM/PM', () => {
    expect(formatTime12('17:00:00')).toBe('5:00 PM');
    expect(formatTime12('19:00:00')).toBe('7:00 PM');
  });

  it('preserves times that already use AM/PM', () => {
    expect(formatTime12('5:00 pm')).toBe('5:00 PM');
  });
});
