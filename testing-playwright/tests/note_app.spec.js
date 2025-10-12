const { test, expect } = require('@playwright/test');
const { describe } = require('node:test');

describe('Note app', () => {
  test('front page can be opened', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const locator = await page.getByText('Notes');
    await expect(locator).toBeVisible();
    await expect(
      page.getByText(
        'Note app, Department of Computer Science, University of Helsinki 2025'
      )
    ).toBeVisible();
  });
});
