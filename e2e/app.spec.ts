import { test, expect } from '@playwright/test'

test.describe('LokiSpesi App', () => {
  test('loads the diary page', async ({ page }) => {
    await page.goto('/')
    // Should redirect to /app/diary
    await expect(page).toHaveURL(/\/app\/diary/)

    // Should show the header
    await expect(page.locator('h1')).toBeVisible()

    // Should show the bottom nav
    await expect(page.locator('nav')).toBeVisible()
  })

  test('navigates between tabs', async ({ page }) => {
    await page.goto('/app/diary')

    // Click wallet tab
    await page.locator('nav button', { hasText: 'Portafoglio' }).click()
    await expect(page).toHaveURL(/\/app\/wallet/)

    // Click overview tab
    await page.locator('nav button', { hasText: 'Panoramica' }).click()
    await expect(page).toHaveURL(/\/app\/overview/)

    // Click back to diary
    await page.locator('nav button', { hasText: 'Diario' }).click()
    await expect(page).toHaveURL(/\/app\/diary/)
  })

  test('opens add expense modal', async ({ page }) => {
    await page.goto('/app/diary')

    // Click FAB button
    await page.locator('[aria-label="Aggiungi spesa"]').click()

    // Should show the modal
    await expect(page.locator('text=Nuova spesa')).toBeVisible()
  })

  test('PWA manifest is served', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest')
    expect(response?.status()).toBe(200)

    const json = await response?.json()
    expect(json.name).toBe('LokiSpesi')
    expect(json.display).toBe('standalone')
  })
})
