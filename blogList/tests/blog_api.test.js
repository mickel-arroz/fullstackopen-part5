const { test, beforeEach, after, before } = require('node:test');
const assert = require('node:assert');
const supertest = require('supertest');

const helper = require('./test_helper');
const User = require('../models/user');
const { app, connectDB } = require('../app');
const api = supertest(app);

const Blog = require('../models/blog');
const mongoose = require('mongoose');

before(async () => {
  await connectDB();
});

let authHeader;
let ownerUserId;

beforeEach(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({ username: { $in: ['root-test', 'other-user'] } });

  // Crear usuario dueño y token
  const { user, token } = await helper.ensureTestUserAndToken();
  authHeader = `Bearer ${token}`;
  ownerUserId = user._id;

  // Insertar blogs iniciales asociados al usuario
  const blogDocs = helper.initialBlogs.map(
    (b) => new Blog({ ...b, user: ownerUserId })
  );
  await Blog.insertMany(blogDocs);
  user.blogs = (user.blogs || []).concat(blogDocs.map((b) => b._id));
  await user.save();
});

test("the unique identifier is named 'id'", async () => {
  const response = await api.get('/api/blogs');
  const blogs = response.body;

  for (let blog of blogs) {
    assert.ok(blog.id);
    assert.strictEqual(blog._id, undefined);
  }
});

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs');

  assert.strictEqual(response.body.length, helper.initialBlogs.length);
});

test('a valid blog can be added with valid token', async () => {
  const initialBlogs = await helper.blogsInDb();
  const newBlog = {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
  };

  await api
    .post('/api/blogs')
    .set('Authorization', authHeader)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/);

  const blogsAfterPost = await helper.blogsInDb();
  assert.strictEqual(blogsAfterPost.length, initialBlogs.length + 1);
  const titles = blogsAfterPost.map((blog) => blog.title);
  assert.ok(titles.includes('Canonical string reduction'));
});

test('if likes property is missing, it defaults to 0 (auth required)', async () => {
  const newBlog = {
    title: 'The unknown blog',
    author: 'Anonymous',
    url: 'http://localhost:3003/blogs/unknown',
  };

  await api
    .post('/api/blogs')
    .set('Authorization', authHeader)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/);

  const blogsAfterPost = await helper.blogsInDb();
  const addedBlog = blogsAfterPost.find(
    (blog) => blog.title === 'The unknown blog'
  );

  assert.strictEqual(addedBlog.likes, 0);
});

test('if title or url is missing, returns 400 Bad Request (auth required)', async () => {
  // Caso 1: Falta title
  let newBlog = {
    author: 'Someone',
    url: 'http://localhost:3003/blogs/example',
    likes: 5,
  };

  let response = await api
    .post('/api/blogs')
    .set('Authorization', authHeader)
    .send(newBlog)
    .expect(400)
    .expect('Content-Type', /application\/json/);

  assert.ok(response.body.error.includes('title'));

  // Caso 2: Falta url
  newBlog = {
    title: 'No URL here',
    author: 'Someone else',
    likes: 2,
  };

  response = await api
    .post('/api/blogs')
    .set('Authorization', authHeader)
    .send(newBlog)
    .expect(400)
    .expect('Content-Type', /application\/json/);

  assert.ok(response.body.error.includes('url'));
});

test('a blog can be deleted successfully by its owner', async () => {
  const initialBlogs = await helper.blogsInDb();

  // Tomamos el ID del primer blog
  const blogToDelete = initialBlogs[0];

  // Hacemos DELETE al endpoint con ese ID
  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set('Authorization', authHeader)
    .expect(204);

  // Verificamos que la cantidad de blogs haya disminuido en uno
  const blogsAfterDeletion = await helper.blogsInDb();
  assert.strictEqual(blogsAfterDeletion.length, initialBlogs.length - 1);

  // Aseguramos que el blog eliminado ya no esté en la base de datos
  const titles = blogsAfterDeletion.map((blog) => blog.title);
  assert.ok(!titles.includes(blogToDelete.title));
});

test('fails to delete with invalid id format (auth required)', async () => {
  const invalidId = 'this-is-not-a-valid-id';

  await api
    .delete(`/api/blogs/${invalidId}`)
    .set('Authorization', authHeader)
    .expect(400)
    .expect('Content-Type', /application\/json/);

  const blogsAfter = await helper.blogsInDb();
  assert.strictEqual(blogsAfter.length, helper.initialBlogs.length);
});

test('a blog can be updated successfully (no auth enforced for PUT yet)', async () => {
  const blogsAtStart = await helper.blogsInDb();
  const blogToUpdate = blogsAtStart[0];

  const updatedData = {
    likes: blogToUpdate.likes + 1,
    title: blogToUpdate.title, // opcional: puedes modificar otros campos también
  };

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(updatedData)
    .expect(200)
    .expect('Content-Type', /application\/json/);

  const blogsAfterUpdate = await helper.blogsInDb();
  const updatedBlog = blogsAfterUpdate.find(
    (blog) => blog.id === blogToUpdate.id
  );

  assert.strictEqual(updatedBlog.likes, blogToUpdate.likes + 1);
});

test('adding blog without token returns 401', async () => {
  const initialBlogs = await helper.blogsInDb();
  const newBlog = {
    title: 'No auth blog',
    url: 'http://noauth',
    author: 'X',
    likes: 5,
  };
  await api.post('/api/blogs').send(newBlog).expect(401);
  const after = await helper.blogsInDb();
  assert.strictEqual(after.length, initialBlogs.length);
  const titles = after.map((b) => b.title);
  assert.ok(!titles.includes('No auth blog'));
});

test('deleting blog with token of another user returns 403', async () => {
  // crear otro usuario y token
  const otherUser = new User({
    username: 'other-user',
    passwordHash:
      '$2a$10$abcdefghijkABCDEFGHIJK1234567890abcdabcdabcdabcdabcdab',
  });
  await otherUser.save();
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { username: 'other-user', id: otherUser._id },
    process.env.SECRET,
    { expiresIn: 3600 }
  );
  const otherHeader = `Bearer ${token}`;

  const blogs = await helper.blogsInDb();
  const target = blogs[0];

  await api
    .delete(`/api/blogs/${target.id}`)
    .set('Authorization', otherHeader)
    .expect(403);
});

test('fails to update with invalid id format', async () => {
  const invalidId = 'this-is-not-a-valid-id';
  const updatedData = { likes: 100 };
  await api
    .put(`/api/blogs/${invalidId}`)
    .send(updatedData)
    .expect(400)
    .expect('Content-Type', /application\/json/);
  const blogsAfter = await helper.blogsInDb();
  const allIds = blogsAfter.map((blog) => blog.id);
  assert.ok(!allIds.includes(invalidId));
});

after(async () => {
  await mongoose.connection.close();
});
