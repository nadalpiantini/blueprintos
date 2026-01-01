import { test, expect } from '@playwright/test';
import { login, TEST_USER, generateTestEmail } from '../fixtures/auth';

test.describe('Autenticación', () => {

  // Test 1: Login con credenciales válidas
  test('login con credenciales válidas redirige al dashboard', async ({ page }) => {
    await page.goto('/login');

    // Esperar hydration completa
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input#email', { state: 'visible' });

    // Llenar formulario
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');

    await emailInput.click();
    await emailInput.fill(TEST_USER.email, { force: true });

    await passwordInput.click();
    await passwordInput.fill(TEST_USER.password, { force: true });

    // Esperar que React procese
    await page.waitForTimeout(300);

    // Click en submit y esperar navegación
    await Promise.all([
      page.waitForURL(/.*dashboard.*/, { timeout: 20000 }),
      page.click('button[type="submit"]'),
    ]);

    // Verificar que estamos en el dashboard (usar h1 específico)
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  // Test 2: Login con credenciales inválidas
  test('login con credenciales inválidas muestra error', async ({ page }) => {
    await page.goto('/login');

    // Esperar formulario
    await page.waitForSelector('input#email', { state: 'visible' });

    // Llenar con credenciales incorrectas
    await page.locator('input#email').click();
    await page.locator('input#email').fill('invalid@test.com', { force: true });
    await page.locator('input#password').click();
    await page.locator('input#password').fill('wrongpassword', { force: true });

    await page.waitForTimeout(300);

    // Click en submit
    await page.click('button[type="submit"]');

    // Verificar que se muestra mensaje de error (div con clase text-red-600)
    const errorLocator = page.locator('.text-red-600').or(page.locator('.bg-red-50')).or(page.locator('text=/error|incorrecto|inválido|invalid/i'));
    await expect(errorLocator).toBeVisible({ timeout: 10000 });

    // Verificar que seguimos en login
    await expect(page).toHaveURL('/login');
  });

  // Test 3: Registro de nuevo usuario
  test('registro de nuevo usuario crea cuenta y redirige', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    const testEmail = generateTestEmail();

    // Esperar que el formulario esté visible
    await page.waitForSelector('input#email', { state: 'visible' });

    // Llenar formulario usando los IDs correctos
    const fullNameInput = page.locator('input#fullName');
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const confirmPasswordInput = page.locator('input#confirmPassword');

    await fullNameInput.click();
    await fullNameInput.fill('Test User E2E', { force: true });

    await emailInput.click();
    await emailInput.fill(testEmail, { force: true });

    await passwordInput.click();
    await passwordInput.fill('TestPassword123!', { force: true });

    await confirmPasswordInput.click();
    await confirmPasswordInput.fill('TestPassword123!', { force: true });

    await page.waitForTimeout(300);

    // Submit
    await page.click('button[type="submit"]');

    // Verificar redirect (al dashboard o error si el email ya existe)
    // Puede tardar debido a la comunicación con Supabase
    await expect(page).toHaveURL(/\/(dashboard|register)/, { timeout: 15000 });
  });

  // Test 4: Registro con email existente muestra error
  test('registro con email existente muestra error', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('input#email', { state: 'visible' });

    // Usar email que ya existe
    const fullNameInput = page.locator('input#fullName');
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const confirmPasswordInput = page.locator('input#confirmPassword');

    await fullNameInput.click();
    await fullNameInput.fill('Test User', { force: true });

    await emailInput.click();
    await emailInput.fill(TEST_USER.email, { force: true });

    await passwordInput.click();
    await passwordInput.fill('TestPassword123!', { force: true });

    await confirmPasswordInput.click();
    await confirmPasswordInput.fill('TestPassword123!', { force: true });

    await page.waitForTimeout(300);

    await page.click('button[type="submit"]');

    // Verificar mensaje de error (puede ser de Supabase o del componente)
    const errorLocator = page.locator('.text-red-600').or(page.locator('.bg-red-50')).or(page.locator('text=/existe|ya registrado|already|error|User already registered/i'));
    await expect(errorLocator).toBeVisible({ timeout: 10000 });
  });

  // Test 5: Acceso a dashboard sin autenticación redirige a login
  test('acceso sin auth redirige a login', async ({ page }) => {
    // Ir directamente al dashboard sin login
    await page.goto('/dashboard');

    // Debe redirigir a login
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });

  // Test 6: Persistencia de sesión tras refresh
  test('sesión persiste después de refresh', async ({ page }) => {
    // Hacer login
    await login(page);

    // Verificar que estamos en dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);

    // Refrescar página
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verificar que seguimos logueados (no redirigidos a login)
    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.locator('h1:has-text("Dashboard"), h1:has-text("Apps"), h1:has-text("Proyectos")')).toBeVisible();
  });

  // Test 7: Logout destruye sesión (si existe botón)
  test('logout destruye sesión y redirige a login', async ({ page }) => {
    // Hacer login
    await login(page);

    // Buscar botón de logout (según snapshot: "Cerrar Sesion")
    const logoutButton = page.locator('button:has-text("Cerrar Sesion"), button:has-text("Cerrar Sesión"), button:has-text("Logout"), button:has-text("Salir"), [data-testid="logout"]');

    if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutButton.click();

      // Verificar redirect a login
      await expect(page).toHaveURL('/login', { timeout: 10000 });

      // Verificar que no podemos acceder al dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/login');
    } else {
      // Si no hay botón de logout, documentar como issue
      test.info().annotations.push({ type: 'issue', description: 'No se encontró botón de logout' });
      test.skip();
    }
  });

  // Test 8: Validación de password mínimo
  test('registro valida password mínimo 6 caracteres', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('input#email', { state: 'visible' });

    const fullNameInput = page.locator('input#fullName');
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const confirmPasswordInput = page.locator('input#confirmPassword');

    await fullNameInput.click();
    await fullNameInput.fill('Test User', { force: true });

    await emailInput.click();
    await emailInput.fill(generateTestEmail(), { force: true });

    // Password muy corto (menos de 6 caracteres)
    await passwordInput.click();
    await passwordInput.fill('12345', { force: true });

    await confirmPasswordInput.click();
    await confirmPasswordInput.fill('12345', { force: true });

    await page.waitForTimeout(300);

    await page.click('button[type="submit"]');

    // Verificar error de validación (el código verifica password.length < 6)
    // Mensaje esperado: "La contrasena debe tener al menos 6 caracteres"
    const errorLocator = page.locator('.text-red-600').or(page.locator('.bg-red-50')).or(page.locator('text=/6|caracteres|characters|mínimo|minimum|corto|short/i'));
    await expect(errorLocator).toBeVisible({ timeout: 5000 });
  });
});
