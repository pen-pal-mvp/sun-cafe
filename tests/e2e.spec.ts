import { test, expect } from '@playwright/test';

test('E2E Environment Verification', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('http://localhost:3000/');
});