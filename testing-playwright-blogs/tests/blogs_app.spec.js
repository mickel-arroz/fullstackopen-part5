const { test, expect, beforeEach, describe } = require('@playwright/test');

const BLOG_TITLE = `Test Blog Title ${Date.now()}`;
const BLOG_TITLE_2 = `Another Blog Title ${Date.now()}`;
const BLOG_AUTHOR = 'Test Author';
const BLOG_URL = 'http://testblog.com';

describe('Blog app', () => {
  beforeEach(async ({ page }) => {
    await page.request.post('/api/testing/reset');
    await page.request.post('/api/users', {
      data: {
        name: 'Test',
        username: 'test',
        password: 'testpassword',
      },
    });
    await page.goto('/');
  });

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByText('username')).toBeVisible();
    await expect(page.getByText('password')).toBeVisible();
  });

  describe('Login', () => {
    test('User can log in', async ({ page }) => {
      await page.getByTestId('username').fill('test');
      await page.getByTestId('password').fill('testpassword');
      await page.getByRole('button', { name: 'Login' }).click();

      await expect(page.getByText('Test logged-in')).toBeVisible();
    });

    test('Login fails with wrong password', async ({ page }) => {
      await page.getByTestId('username').fill('test');
      await page.getByTestId('password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Login' }).click();

      const errorNotification = page.locator('#notification');
      await expect(errorNotification).toBeVisible();
      await expect(errorNotification).toHaveText('Wrong credentials');
    });

    test('A logged-in user can create a blog', async ({ page }) => {
      await page.getByTestId('username').fill('test');
      await page.getByTestId('password').fill('testpassword');
      await page.getByRole('button', { name: 'Login' }).click();

      await page.getByRole('button', { name: /new blog/i }).click();
      await page.locator('#title').fill(BLOG_TITLE);
      await page.locator('#author').fill(BLOG_AUTHOR);
      await page.locator('#url').fill(BLOG_URL);
      await page.getByRole('button', { name: /create/i }).click();

      await expect(
        page.getByText(`${BLOG_TITLE} by ${BLOG_AUTHOR}`, { exact: true })
      ).toBeVisible();
    });

    test('A logged-in user can like a blog', async ({ page }) => {
      await page.getByTestId('username').fill('test');
      await page.getByTestId('password').fill('testpassword');
      await page.getByRole('button', { name: 'Login' }).click();

      await page.getByRole('button', { name: /new blog/i }).click();
      await page.locator('#title').fill(BLOG_TITLE);
      await page.locator('#author').fill(BLOG_AUTHOR);
      await page.locator('#url').fill(BLOG_URL);
      await page.getByRole('button', { name: /create/i }).click();

      await page.getByRole('button', { name: /view/i }).click();
      await page.getByRole('button', { name: /like/i }).click();

      await expect(page.getByText('likes: 1')).toBeVisible();
    });

    test('A logged-in user can delete their blog', async ({ page }) => {
      await page.getByTestId('username').fill('test');
      await page.getByTestId('password').fill('testpassword');
      await page.getByRole('button', { name: 'Login' }).click();

      await page.getByRole('button', { name: /new blog/i }).click();
      await page.locator('#title').fill(BLOG_TITLE);
      await page.locator('#author').fill(BLOG_AUTHOR);
      await page.locator('#url').fill(BLOG_URL);
      await page.getByRole('button', { name: /create/i }).click();

      await page.getByRole('button', { name: /view/i }).click();

      // Mock the confirmation dialog
      // Antes de hacer click en el botón eliminar ya que sino no se mockeara cuando se le de a delete.
      await page.evaluate(() => {
        window.confirm = () => true;
      });

      await page.getByRole('button', { name: /delete/i }).click();

      await expect(
        page.getByText(`${BLOG_TITLE} by ${BLOG_AUTHOR}`, { exact: true })
      ).not.toBeVisible();
    });

    test('Only the creator can see the delete button for their blog', async ({
      page,
    }) => {
      // Log in as the creator
      await page.getByTestId('username').fill('test');
      await page.getByTestId('password').fill('testpassword');
      await page.getByRole('button', { name: 'Login' }).click();

      // Create a new blog
      await page.getByRole('button', { name: /new blog/i }).click();
      await page.locator('#title').fill(BLOG_TITLE);
      await page.locator('#author').fill(BLOG_AUTHOR);
      await page.locator('#url').fill(BLOG_URL);
      await page.getByRole('button', { name: /create/i }).click();

      // Log out
      await page.getByRole('button', { name: 'logout' }).click();

      // Log in as a different user
      await page.request.post('/api/users', {
        data: {
          name: 'Another User',
          username: 'anotheruser',
          password: 'anotherpassword',
        },
      });
      await page.getByTestId('username').fill('anotheruser');
      await page.getByTestId('password').fill('anotherpassword');
      await page.getByRole('button', { name: 'Login' }).click();

      // Mock the confirmation dialog
      // Antes de hacer click en el botón eliminar ya que sino no se mockeara cuando se le de a delete.
      await page.evaluate(() => {
        window.confirm = () => true;
      });

      // Check that the delete button is not visible
      await page.getByRole('button', { name: /view/i }).click();

      await page.getByRole('button', { name: /delete/i }).click();

      await expect(
        page.getByText(`Error deleting blog`, { exact: true })
      ).toBeVisible();
    });

    test('blogs are ordered by likes, most liked first', async ({ page }) => {
      await page.getByTestId('username').fill('test');
      await page.getByTestId('password').fill('testpassword');
      await page.getByRole('button', { name: 'Login' }).click();

      // create first blog
      await page.getByRole('button', { name: /new blog/i }).click();
      await page.locator('#title').fill(BLOG_TITLE);
      await page.locator('#author').fill(BLOG_AUTHOR);
      await page.locator('#url').fill(BLOG_URL);
      await page.getByRole('button', { name: /create/i }).click();

      await expect(
        page.getByText(`${BLOG_TITLE} by ${BLOG_AUTHOR}`, { exact: true })
      ).toBeVisible();

      // create second blog
      await page.getByRole('button', { name: /new blog/i }).click();
      await page.locator('#title').fill(BLOG_TITLE_2);
      await page.locator('#author').fill(BLOG_AUTHOR);
      await page.locator('#url').fill(BLOG_URL);
      await page.getByRole('button', { name: /create/i }).click();

      await expect(
        page.getByText(`${BLOG_TITLE_2} by ${BLOG_AUTHOR}`, { exact: true })
      ).toBeVisible();

      // like the second blog once

      const blog2Title = page.getByText(`${BLOG_TITLE_2} by ${BLOG_AUTHOR}`, {
        exact: true,
      });

      await page.getByRole('button', { name: /view/i }).nth(1).click();
      await page.getByRole('button', { name: /like/i }).click();
      await expect(page.getByText('likes: 1')).toBeVisible();

      // first blog in the list should now be the second blog (most likes)
      const firstBlog = page
        .locator('div:has-text("by ' + BLOG_AUTHOR + '")')
        .first();
      await expect(firstBlog).toContainText(BLOG_TITLE_2);
    });
  });
});
