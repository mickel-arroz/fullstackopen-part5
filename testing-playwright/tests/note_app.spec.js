const { test, describe, expect, beforeEach } = require('@playwright/test');
const { loginWith, createNote } = require('./helper');

describe('Note app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset');
    await request.post('/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen',
      },
    });

    await page.goto('/');
  });

  test('front page can be opened', async ({ page }) => {
    const locator = await page.getByText('Notes');
    await expect(locator).toBeVisible();
    await expect(
      page.getByText(
        'Note app, Department of Computer Science, University of Helsinki 2025'
      )
    ).toBeVisible();
  });

  test('login form can be opened', async ({ page }) => {
    await loginWith(page, 'mluukkai', 'salainen');
    await expect(page.getByText('Matti Luukkainen logged-in')).toBeVisible();
  });

  describe('when logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen');
    });

    test('a new note can be created', async ({ page }) => {
      await createNote(page, 'a note created by playwright', true);
      await expect(
        page.getByText('a note created by playwright').last()
      ).toBeVisible();
    });

    describe('and a note exists', () => {
      beforeEach(async ({ page }) => {
        await createNote(page, 'another note by playwright', true);
      });

      test('importance can be changed', async ({ page }) => {
        await page.getByRole('button', { name: 'make not important' }).click();
        await expect(page.getByText('make important')).toBeVisible();
      });
    });

    describe('and several notes exists', () => {
      beforeEach(async ({ page }) => {
        await createNote(page, 'first note', true);
        await createNote(page, 'second note', true);
        await createNote(page, 'third note', true);
      });

      test('one of those can be made nonimportant', async ({ page }) => {
        const secondNoteElement = await page
          .getByText('second note')
          .locator('..');
        await secondNoteElement
          .getByRole('button', { name: 'make not important' })
          .click();
        await expect(
          secondNoteElement.getByText('make important')
        ).toBeVisible();
      });
    });
  });

  test('login fails with wrong password', async ({ page }) => {
    await page.getByRole('button', { name: 'log in' }).click();
    await page.getByTestId('username').fill('mluukkai');
    await page.getByTestId('password').fill('wrong');
    await page.getByRole('button', { name: 'login' }).click();

    const errorDiv = await page.locator('.error');
    await expect(errorDiv).toContainText('Wrong credentials');
    await expect(errorDiv).toHaveCSS('border-style', 'solid');
    await expect(errorDiv).toHaveCSS('color', 'rgb(255, 0, 0)');

    await expect(
      page.getByText('Matti Luukkainen logged in')
    ).not.toBeVisible();
  });
});
