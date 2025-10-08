import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Blog from './Blog';

test('renders content', () => {
  const blog = {
    title: 'Component testing is done with react-testing-library',
    author: 'John Doe',
    url: 'https://example.com',
    likes: 5,
  };

  render(<Blog blog={blog} onLike={() => {}} onDelete={() => {}} />);
  // visibles: título y autor
  expect(screen.getByText(blog.title)).toBeInTheDocument();
  expect(screen.getByText(new RegExp(blog.author, 'i'))).toBeInTheDocument();

  // no mostrados por defecto: URL y likes
  expect(screen.queryByText(blog.url)).toBeNull();
  expect(
    screen.queryByText(new RegExp(`likes\\s*:?\\s*${blog.likes}`, 'i'))
  ).toBeNull();
  expect(
    screen.queryByText(new RegExp(`^${blog.likes}\\s*likes`, 'i'))
  ).toBeNull();
});

test('muestra URL y likes al hacer clic en el botón de ver detalles', async () => {
  const blog = {
    title: 'Component testing is done with react-testing-library',
    author: 'John Doe',
    url: 'https://example.com',
    likes: 5,
  };

  render(<Blog blog={blog} onLike={() => {}} onDelete={() => {}} />);

  // inicialmente ocultos
  expect(screen.queryByText(blog.url)).toBeNull();
  expect(screen.queryByText(/likes\s*:\s*\d+/i)).toBeNull();

  // al hacer clic en "view" se deben mostrar
  const user = userEvent.setup();
  const viewButton = screen.getByRole('button', { name: /view/i });
  await user.click(viewButton);

  // URL visible (el componente la muestra como "url: <url>")
  expect(
    screen.getByText(
      new RegExp(`${blog.url.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`)
    )
  ).toBeInTheDocument();
  // likes visible (el componente la muestra como "likes: <n>")
  expect(
    screen.getByText(new RegExp(`likes\\s*:\\s*${blog.likes}`, 'i'))
  ).toBeInTheDocument();
});

test('llama al controlador onLike dos veces cuando se hace clic dos veces en el botón like', async () => {
  const blog = {
    id: '1',
    title: 'Component testing is done with react-testing-library',
    author: 'John Doe',
    url: 'https://example.com',
    likes: 5,
  };

  const onLike = vi.fn();
  const onDelete = vi.fn();

  render(<Blog blog={blog} onLike={onLike} onDelete={onDelete} />);

  const user = userEvent.setup();
  // Mostrar los detalles primero
  await user.click(screen.getByRole('button', { name: /view/i }));

  const likeButton = screen.getByRole('button', { name: /like/i });
  await user.click(likeButton);
  await user.click(likeButton);

  expect(onLike).toHaveBeenCalledTimes(2);
});
