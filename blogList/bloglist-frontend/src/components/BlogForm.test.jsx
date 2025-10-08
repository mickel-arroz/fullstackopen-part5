import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlogForm from './BlogForm';

test('llama al controlador con los detalles correctos al crear un nuevo blog', async () => {
  const createBlog = vi.fn();
  const { container } = render(<BlogForm createBlog={createBlog} />);

  const user = userEvent.setup();

  const titleInput = container.querySelector('input[name="title"]');
  const authorInput = container.querySelector('input[name="author"]');
  const urlInput = container.querySelector('input[name="url"]');

  await user.type(titleInput, 'A new blog');
  await user.type(authorInput, 'Jane Doe');
  await user.type(urlInput, 'https://example.com/new');

  await user.click(screen.getByRole('button', { name: /create/i }));

  expect(createBlog).toHaveBeenCalledTimes(1);
  expect(createBlog).toHaveBeenCalledWith({
    title: 'A new blog',
    author: 'Jane Doe',
    url: 'https://example.com/new',
  });
});
