/**
 * @fileoverview Jest Setup File
 * @description Globale Test-Konfiguration für API-Tests
 */

// Erhöhe Timeout für DB-Operationen
jest.setTimeout(10000);

// Unterdrücke Console-Logs während Tests (optional)
// Auskommentieren, wenn du Logs sehen möchtest
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Globaler Teardown
afterAll(async () => {
  // Hier können DB-Verbindungen geschlossen werden
  // if (mongoose.connection.readyState !== 0) {
  //   await mongoose.connection.close();
  // }
});

// Dummy-Test, damit Jest nicht fehlschlägt
describe('Setup', () => {
  it('should configure test environment', () => {
    expect(true).toBe(true);
  });
});
