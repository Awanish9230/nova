import { calculateSla } from '../src/services/escalation.service';
import { Priority } from '@prisma/client';
import { fetchWeatherRisk } from '../src/services/weather.service';

describe('Business Logic Tests', () => {
  describe('Escalation SLA Logic', () => {
    it('should calculate SLA correctly for CRITICAL (4 hours)', () => {
      const now = Date.now();
      const sla = calculateSla(Priority.CRITICAL);
      const diffHours = (sla.getTime() - now) / (1000 * 60 * 60);
      expect(Math.round(diffHours)).toBe(4);
    });

    it('should calculate SLA correctly for LOW (7 days)', () => {
      const now = Date.now();
      const sla = calculateSla(Priority.LOW);
      const diffDays = (sla.getTime() - now) / (1000 * 60 * 60 * 24);
      expect(Math.round(diffDays)).toBe(7);
    });
  });

  describe('Weather Risk Logic', () => {
    let globalFetch: typeof fetch;

    beforeAll(() => {
      globalFetch = global.fetch;
    });

    afterAll(() => {
      global.fetch = globalFetch;
    });

    it('should return SEVERE if wind speed > 40', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ current: { wind_speed_10m: 50, precipitation: 0, temperature_2m: 20 } }),
        } as any)
      );

      const risk = await fetchWeatherRisk('40,-74');
      expect(risk).toBe('SEVERE');
    });

    it('should return UNKNOWN and gracefully fallback on API failure', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const risk = await fetchWeatherRisk('40,-74');
      expect(risk).toBe('UNKNOWN');
    });
  });
});
