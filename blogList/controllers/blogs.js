const blogsRouter = require('express').Router();
const mongoose = require('mongoose');
const Blog = require('../models/blog');

// GET all blogs (populate user basic info)
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 });
  response.json(blogs);
});

// CREATE new blog (auth required)
blogsRouter.post('/', async (request, response) => {
  const {
    title,
    author,
    url,
    likes = 0, // default value if likes is undefined
  } = request.body;

  if (!title || !url) {
    return response.status(400).json({ error: 'title and url are required' });
  }
  const user = request.user;
  if (!user)
    return response.status(401).json({ error: 'authentication required' });

  const blog = new Blog({
    title,
    author,
    url,
    likes: likes === undefined ? 0 : likes,
    user: user._id,
  });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();
  const populated = await savedBlog.populate('user', { username: 1, name: 1 });
  response.status(201).json(populated);
});

// UPDATE blog
blogsRouter.put('/:id', async (request, response) => {
  if (!mongoose.Types.ObjectId.isValid(request.params.id)) {
    return response.status(400).json({ error: 'malformatted id' });
  }
  const { title, author, url, likes } = request.body;

  const blogData = { title, author, url, likes };
  const updated = await Blog.findByIdAndUpdate(request.params.id, blogData, {
    new: true,
    runValidators: true,
  }).populate('user', { username: 1, name: 1 });

  if (!updated) {
    return response.status(404).json({ error: 'Blog not found' });
  }
  response.json(updated);
});

// DELETE blog (only owner)
blogsRouter.delete('/:id', async (request, response) => {
  if (!mongoose.Types.ObjectId.isValid(request.params.id)) {
    return response.status(400).json({ error: 'malformatted id' });
  }
  const blog = await Blog.findById(request.params.id);
  if (!blog) {
    return response.status(404).json({ error: 'Blog not found' });
  }
  const user = request.user;
  if (!user)
    return response.status(401).json({ error: 'authentication required' });
  if (blog.user && blog.user.toString() !== user._id.toString()) {
    return response
      .status(403)
      .json({ error: 'not authorized to delete this blog' });
  }

  await Blog.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

module.exports = blogsRouter;
