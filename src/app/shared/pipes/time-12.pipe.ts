import { Pipe, PipeTransform } from '@angular/core';

export function formatTime12(value: string | Date | null | undefined): string {
  if (value == null || value === '') {
    return '';
  }

  if (typeof value === 'string') {
    const existingAmPm = value.trim().match(/(?:^|\b)(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*)(AM|PM)\b/i);

    if (existingAmPm) {
      let hours = Number(existingAmPm[1]);
      const minutes = String(existingAmPm[2]).padStart(2, '0');

      if (hours >= 1 && hours <= 12) {
        return `${hours}:${minutes} ${existingAmPm[3].toUpperCase()}`;
      }
    }

    const timeMatch = value.match(/(?:^|T|\s)(\d{1,2}):(\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/);

    if (timeMatch) {
      const hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2]);

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
      }
    }
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

@Pipe({
  name: 'time12',
  standalone: true
})
export class Time12Pipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    return formatTime12(value);
  }
}
