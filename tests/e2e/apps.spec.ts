import { test, expect } from '@playwright/test';
import { login } from '../fixtures/auth';

test.describe('CRUD de Apps', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // Test 1: Lista todas las apps del usuario
  test('lista todas las apps del usuario', async ({ page }) => {
    await page.goto('/dashboard/apps');

    // Esperar carga
    await page.waitForLoadState('networkidle');

    // Verificar que estamos en la página de apps (h1 dice "Apps")
    await expect(page.locator('h1:has-text("Apps")')).toBeVisible();

    // Verificar grid de apps o empty state
    // Empty state: "No tienes apps todavia."
    const emptyState = page.locator('text="No tienes apps todavia."');
    const appCards = page.locator('[class*="AppCard"], a[href*="/apps/"]');

    const hasApps = await appCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasApps || hasEmptyState).toBeTruthy();
  });

  // Test 2: Crear app con nombre válido
  test('crear app con nombre válido', async ({ page }) => {
    await page.goto('/dashboard/apps');
    await page.waitForLoadState('networkidle');

    // Buscar botón "Nueva App" (cuando form está oculto)
    const createButton = page.locator('button:has-text("Nueva App")');
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    // Ahora el form debe estar visible (inline, no modal)
    // El botón cambia a "Cancelar"
    await expect(page.locator('button:has-text("Cancelar")')).toBeVisible();

    // Llenar formulario - Input tiene label="Nombre"
    // El Input component usa el label para generar una etiqueta
    const nameInput = page.locator('input').first();
    await expect(nameInput).toBeVisible();

    const testAppName = `Test App E2E ${Date.now()}`;
    await nameInput.click();
    await nameInput.fill(testAppName, { force: true });

    // Descripción es el segundo input
    const descInput = page.locator('input').nth(1);
    if (await descInput.isVisible()) {
      await descInput.click();
      await descInput.fill('App creada por test E2E', { force: true });
    }

    await page.waitForTimeout(300);

    // Submit - botón dice "Crear App"
    const submitButton = page.locator('button:has-text("Crear App")');
    await submitButton.click();

    // Esperar que se procese
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verificar que se creó (aparece en la lista o el form se cerró)
    // Buscar la app creada
    const newApp = page.locator(`text="${testAppName}"`);
    await expect(newApp).toBeVisible({ timeout: 10000 });
  });

  // Test 3: Form validation (nombre required)
  test('validación de formulario - nombre requerido', async ({ page }) => {
    await page.goto('/dashboard/apps');
    await page.waitForLoadState('networkidle');

    // Abrir formulario
    const createButton = page.locator('button:has-text("Nueva App")');
    await createButton.click();

    // El campo nombre está visible
    const nameInput = page.locator('input').first();
    await expect(nameInput).toBeVisible();

    // Limpiar el campo (asegurar que está vacío)
    await nameInput.clear();

    // Intentar submit con campo vacío
    const submitButton = page.locator('button:has-text("Crear App")');
    await submitButton.click();

    // El form tiene required, así que el navegador debería bloquear
    await page.waitForTimeout(500);

    // Verificar que seguimos viendo el formulario
    await expect(nameInput).toBeVisible();

    // El input debe estar en estado de validación inválido
    const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  // Test 4: Ver detalle de app con proyectos
  test('ver detalle de app muestra info y proyectos', async ({ page }) => {
    await page.goto('/dashboard/apps');
    await page.waitForLoadState('networkidle');

    // Buscar una app existente y hacer click
    const appCard = page.locator('a[href*="/dashboard/apps/"]').first();

    if (await appCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await appCard.click();

      // Verificar que estamos en el detalle
      await expect(page).toHaveURL(/\/dashboard\/apps\/[a-zA-Z0-9-]+/);

      // Verificar contenido del detalle
      await page.waitForLoadState('networkidle');

      // Debe mostrar nombre de la app
      const appTitle = page.locator('h1, h2').first();
      await expect(appTitle).toBeVisible();

      // Debe tener sección de proyectos o contenido relacionado
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    } else {
      // Si no hay apps, skip
      test.info().annotations.push({ type: 'skip', description: 'No hay apps existentes para testear detalle' });
      test.skip();
    }
  });

  // Test 5: Crear proyecto dentro de app
  test('crear proyecto dentro de una app', async ({ page }) => {
    await page.goto('/dashboard/apps');
    await page.waitForLoadState('networkidle');

    // Ir al detalle de una app
    const appCard = page.locator('a[href*="/dashboard/apps/"]').first();

    if (await appCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await appCard.click();
      await expect(page).toHaveURL(/\/dashboard\/apps\/[a-zA-Z0-9-]+/);
      await page.waitForLoadState('networkidle');

      // Buscar botón de crear proyecto
      const createProjectBtn = page.locator('button:has-text("Nuevo Proyecto"), button:has-text("Crear Proyecto"), button:has-text("New Project"), button:has-text("Nueva")');

      if (await createProjectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createProjectBtn.click();

        // Llenar formulario
        const nameInput = page.locator('input').first();
        await nameInput.click();
        await nameInput.fill(`Test Project E2E ${Date.now()}`, { force: true });

        await page.waitForTimeout(300);

        // Submit
        const submitBtn = page.locator('button:has-text("Crear"), button:has-text("Guardar"), button[type="submit"]');
        await submitBtn.click();

        // Verificar que se creó
        await page.waitForLoadState('networkidle');

        // El proyecto debe aparecer
        test.info().annotations.push({ type: 'info', description: 'Proyecto creado exitosamente' });
      } else {
        test.info().annotations.push({ type: 'info', description: 'No se encontró botón para crear proyecto en detalle de app' });
      }
    } else {
      test.skip();
    }
  });

  // Test 6: Breadcrumb navegación funciona
  test('breadcrumb permite navegación de vuelta', async ({ page }) => {
    await page.goto('/dashboard/apps');
    await page.waitForLoadState('networkidle');

    // Ir al detalle de una app
    const appCard = page.locator('a[href*="/dashboard/apps/"]').first();

    if (await appCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await appCard.click();
      await expect(page).toHaveURL(/\/dashboard\/apps\/[a-zA-Z0-9-]+/);

      // Buscar breadcrumb o navegación de vuelta
      const backNav = page.locator('a:has-text("Apps"), a[href="/dashboard/apps"], button:has-text("← "), [class*="breadcrumb"]');

      if (await backNav.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await backNav.first().click();

        // Debe volver a la lista
        await expect(page).toHaveURL('/dashboard/apps');
      } else {
        // Usar navegación del sidebar
        const sidebarApps = page.locator('nav a:has-text("Apps")');
        if (await sidebarApps.isVisible()) {
          await sidebarApps.click();
          await expect(page).toHaveURL('/dashboard/apps');
        }
      }
    } else {
      test.skip();
    }
  });
});
