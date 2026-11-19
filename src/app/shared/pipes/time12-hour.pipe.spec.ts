import { formatTime12Hour } from './time12-hour.pipe';

describe('formatTime12Hour', () => {
  it('formats midnight and afternoon times with AM/PM', () => {
    expect(formatTime12Hour('00:05:00')).toBe('12:05 AM');
    expect(formatTime12Hour('13:30')).toBe('1:30 PM');
  });

  it('normalizes existing AM/PM values and preserves invalid input', () => {
    expect(formatTime12Hour('1:05 pm')).toBe('1:05 PM');
    expect(formatTime12Hour('25:00')).toBe('25:00');
    expect(formatTime12Hour(null)).toBe('');
  });
});
