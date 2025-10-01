const { test, after, beforeEach, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const api = supertest(app);

const helper = require('./test_helper');

const Note = require('../models/note');
const User = require('../models/user');

let authHeader; // se asigna en cada beforeEach

describe('when there is initially some notes saved', () => {
  beforeEach(async () => {
    // Limpiamos colecciones para un estado consistente por test
    await Note.deleteMany({});
    await User.deleteMany({});

    // Creamos usuario inicial
    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({
      username: 'root',
      name: 'Root User',
      passwordHash,
    });
    const savedUser = await user.save();

    // Insertamos notas iniciales asociadas al usuario
    const noteDocs = helper.initialNotes.map(
      (n) => new Note({ ...n, user: savedUser._id })
    );
    const savedNotes = await Note.insertMany(noteDocs);
    savedUser.notes = savedNotes.map((n) => n._id);
    await savedUser.save();

    // Obtenemos token de autenticación
    const loginResp = await api
      .post('/api/login')
      .send({ username: 'root', password: 'sekret' })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    authHeader = `Bearer ${loginResp.body.token}`;
  });

  test('notes are returned as json', async () => {
    await api
      .get('/api/notes')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('all notes are returned', async () => {
    const response = await api.get('/api/notes');

    assert.strictEqual(response.body.length, helper.initialNotes.length);
  });

  test('a specific note is within the returned notes', async () => {
    const response = await api.get('/api/notes');

    const contents = response.body.map((r) => r.content);
    assert(contents.includes('Browser can execute only JavaScript'));
  });

  describe('viewing a specific note', () => {
    test('succeeds with a valid id', async () => {
      const notesAtStart = await helper.notesInDb();
      const noteToView = notesAtStart[0];

      const resultNote = await api
        .get(`/api/notes/${noteToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      // Comparamos campos esenciales (el campo user puede diferir en representación)
      assert.strictEqual(resultNote.body.id, noteToView.id);
      assert.strictEqual(resultNote.body.content, noteToView.content);
      assert.strictEqual(resultNote.body.important, noteToView.important);
    });

    test('fails with statusCode 404 if note does not exist', async () => {
      const validNonexistingId = await helper.nonExistingId();

      await api.get(`/api/notes/${validNonexistingId}`).expect(404);
    });

    test('fails with statusCode 400 id is invalid', async () => {
      const invalidId = '5a3d5da59070081a82a3445';

      await api.get(`/api/notes/${invalidId}`).expect(400);
    });
  });

  describe('addition of a new note', () => {
    // (El test antiguo sin token se ha eliminado porque ahora la ruta exige autenticación)
    test('succeeds with valid data when authorized', async () => {
      const newNote = {
        content: 'async/await simplifies making async calls',
        important: true,
      };

      await api
        .post('/api/notes')
        .set('Authorization', authHeader)
        .send(newNote)
        .expect(201)
        .expect('Content-Type', /application\/json/);

      const notesAtEnd = await helper.notesInDb();
      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length + 1);

      const contents = notesAtEnd.map((n) => n.content);
      assert(contents.includes('async/await simplifies making async calls'));
    });

    // (El test antiguo para data inválida con userId inválido ya no aplica porque ahora se toma el user del token)
    test('fails with 401 if token missing', async () => {
      const newNote = {
        content: 'this will not be added',
        important: false,
      };

      await api.post('/api/notes').send(newNote).expect(401);

      const notesAtEnd = await helper.notesInDb();
      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length);
    });

    test('fails with 400 if content invalid (too short)', async () => {
      const newNote = {
        content: 'abc', // minlength = 5
        important: true,
      };

      await api
        .post('/api/notes')
        .set('Authorization', authHeader)
        .send(newNote)
        .expect(400);

      const notesAtEnd = await helper.notesInDb();
      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length);
    });
  });

  describe('deletion of a note', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const notesAtStart = await helper.notesInDb();
      const noteToDelete = notesAtStart[0];

      await api.delete(`/api/notes/${noteToDelete.id}`).expect(204);

      const notesAtEnd = await helper.notesInDb();

      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length - 1);

      const contents = notesAtEnd.map((r) => r.content);
      assert(!contents.includes(noteToDelete.content));
    });
    test('succeeds with status code 204 if id is valid (no auth required in current implementation)', async () => {
      const notesAtStart = await helper.notesInDb();
      const noteToDelete = notesAtStart[0];

      await api.delete(`/api/notes/${noteToDelete.id}`).expect(204);

      const notesAtEnd = await helper.notesInDb();
      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length - 1);

      const contents = notesAtEnd.map((r) => r.content);
      assert(!contents.includes(noteToDelete.content));
    });
  });
});

after(async () => {
  await mongoose.connection.close();
});
