import { Page } from '@playwright/test';

// Credenciales de test
export const TEST_USER = {
  email: 'nadalpiantini@gmail.com',
  password: 'Teclados#13',
};

// Helper para login
export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/login');

  // Esperar a que la página esté completamente cargada (hydration)
  await page.waitForLoadState('networkidle');

  // Esperar que el formulario esté visible
  await page.waitForSelector('input#email', { state: 'visible', timeout: 10000 });

  // Usar selectores por ID
  const emailInput = page.locator('input#email');
  const passwordInput = page.locator('input#password');

  // Método robusto: usar fill con force para React controlled inputs
  await emailInput.click();
  await emailInput.fill(email, { force: true });

  await passwordInput.click();
  await passwordInput.fill(password, { force: true });

  // Esperar a que React procese los cambios
  await page.waitForTimeout(300);

  // Click en submit y esperar navegación
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
}

// Helper para verificar sesión activa
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.goto('/dashboard');
    await page.waitForSelector('text=Dashboard', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// Helper para logout
export async function logout(page: Page) {
  // Buscar botón de logout en header (si existe)
  const logoutButton = page.locator('button:has-text("Cerrar"), button:has-text("Logout"), button:has-text("Salir")');
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('/login');
  }
}

// Helper para generar email único para tests de registro
export function generateTestEmail(): string {
  const timestamp = Date.now();
  return `test_${timestamp}@blueprintos-test.com`;
}
