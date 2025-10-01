const Blog = require('../models/blog');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const initialBlogs = [
  {
    title: 'La Quinta Monataña',
    author: 'Paulo Cohelo',
    url: 'nomelase.com',
    likes: 666,
  },
  {
    title: 'El Alquimista',
    author: 'Paulo Cohelo',
    url: 'nomelase.com',
    likes: 100,
  },
];

const nonExistingId = async () => {
  const blog = new Blog({ title: 'willremovethissoon' });
  await blog.save();
  await blog.deleteOne();

  return blog._id.toString();
};

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

// Crea un usuario de prueba (si no existe) y devuelve { user, token }
const ensureTestUserAndToken = async () => {
  let user = await User.findOne({ username: 'root-test' });
  if (!user) {
    const passwordHash = await bcrypt.hash('sekret', 10);
    user = new User({
      username: 'root-test',
      name: 'Root Tester',
      passwordHash,
    });
    await user.save();
  }
  const userForToken = { username: user.username, id: user._id };
  const token = jwt.sign(userForToken, process.env.SECRET, {
    expiresIn: 60 * 60,
  });
  return { user, token };
};

module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDb,
  usersInDb,
  ensureTestUserAndToken,
};
