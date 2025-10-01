const { test, beforeEach, after, before } = require('node:test');
const assert = require('node:assert');
const supertest = require('supertest');
const { app, connectDB } = require('../app');
const api = supertest(app);
const User = require('../models/user');
const mongoose = require('mongoose');
const helper = require('./test_helper');

before(async () => {
  await connectDB();
});

beforeEach(async () => {
  await User.deleteMany({
    username: { $in: ['root-test', 'short', 'duplicate', 'validuser'] },
  });
  // usuario base
  const res = await api
    .post('/api/users')
    .send({ username: 'root-test', name: 'Root', password: 'sekret' })
    .expect(201);
  assert.strictEqual(res.body.username, 'root-test');
});

test('creation succeeds with a fresh username', async () => {
  const usersAtStart = await helper.usersInDb();

  const newUser = { username: 'validuser', name: 'Valido', password: 'strong' };
  await api
    .post('/api/users')
    .send(newUser)
    .expect(201)
    .expect('Content-Type', /application\/json/);

  const usersAtEnd = await helper.usersInDb();
  assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);
  assert(usersAtEnd.some((u) => u.username === 'validuser'));
});

test('fails with 400 if username missing', async () => {
  const newUser = { name: 'NoUser', password: 'abcd' };
  const res = await api.post('/api/users').send(newUser).expect(400);
  assert.match(res.body.error, /username is required/);
});

test('fails with 400 if password missing', async () => {
  const newUser = { username: 'nouserpwd' };
  const res = await api.post('/api/users').send(newUser).expect(400);
  assert.match(res.body.error, /password is required/);
});

test('fails with 400 if username too short', async () => {
  const newUser = { username: 'ab', password: 'abcdef' }; // username < 3
  const res = await api.post('/api/users').send(newUser).expect(400);
  assert.match(res.body.error, /username must be at least 3/);
});

test('fails with 400 if password too short', async () => {
  const newUser = { username: 'goodname', password: 'ab' }; // password < 3
  const res = await api.post('/api/users').send(newUser).expect(400);
  assert.match(res.body.error, /password must be at least 3/);
});

test('fails with 400 if username duplicated', async () => {
  const newUser = {
    username: 'root-test',
    name: 'Another',
    password: 'another',
  };
  const res = await api.post('/api/users').send(newUser).expect(400);
  assert.match(res.body.error, /unique/);
});

after(async () => {
  await mongoose.connection.close();
});
