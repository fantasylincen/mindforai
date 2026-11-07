import { expect, test } from '@playwright/test';

test('loads the MindForAI board', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/MindForAI/);
  await expect(page.locator('.mindforai')).toBeVisible();
  await expect(page.locator('.mindforai .plait-board-container')).toBeVisible();
});
