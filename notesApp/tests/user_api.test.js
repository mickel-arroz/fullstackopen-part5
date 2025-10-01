const bcrypt = require('bcrypt');

const { test, beforeEach, describe, after } = require('node:test');
const assert = require('node:assert');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);

const helper = require('./test_helper');

const User = require('../models/user');
const { default: mongoose } = require('mongoose');

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    // Limpiar también notas para evitar referencias residuales de otros tests
    const Note = require('../models/note');
    await Note.deleteMany({});
    // Borramos específicamente usuarios que usamos en este archivo para evitar conflictos de ejecución paralela
    await User.deleteMany({
      username: { $in: ['root-user-tests', 'mluukkai'] },
    });

    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({ username: 'root-user-tests', passwordHash });
    await user.save();
  });

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    // Aseguramos que el nuevo username no existe todavía
    assert(
      !usersAtStart.some((u) => u.username === newUser.username),
      'El usuario de prueba ya existía antes del test'
    );

    const usersAtEnd = await helper.usersInDb();
    const usernames = usersAtEnd.map((u) => u.username);
    assert(usernames.includes(newUser.username));
    // Verificamos que el nuevo usuario aparece exactamente una vez
    const occurrences = usersAtEnd.filter(
      (u) => u.username === newUser.username
    ).length;
    assert.strictEqual(
      occurrences,
      1,
      'El nuevo usuario debería existir exactamente una vez'
    );
  });
});

after(async () => {
  await mongoose.connection.close();
});
