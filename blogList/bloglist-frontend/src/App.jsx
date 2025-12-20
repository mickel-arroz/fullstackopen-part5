import { useState, useEffect, useRef } from 'react';
import Blog from './components/Blog';
import blogService from './services/blogs';
import loginService from './services/login';
import Notification from './components/Notification';
import Togglable from './components/Togglable';
import BlogForm from './components/BlogForm';
import LoginForm from './components/LoginForm';

const App = () => {
  const [blogs, setBlogs] = useState([]);
  const [message, setMessage] = useState(null);
  const [typeMessage, setTypeMessage] = useState(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    blogService.getAll().then((blogs) => setBlogs(blogs));
  }, []);

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedBlogAppUser');
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON);
      setUser(user);
      blogService.setToken(user.token);
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const user = await loginService.login({
        username,
        password,
      });

      window.localStorage.setItem('loggedBlogAppUser', JSON.stringify(user));
      blogService.setToken(user.token);
      setUser(user);
      setUsername('');
      setPassword('');
    } catch (exception) {
      setMessage('Wrong credentials');
      setTypeMessage('error');
      console.error(exception);
      setTimeout(() => {
        setMessage(null);
        setTypeMessage(null);
      }, 5000);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem('loggedBlogAppUser');
    setUser(null);
    blogService.setToken(null);
  };

  const createBlog = async (blogData) => {
    blogFormRef.current.toggleVisibility();

    try {
      const newBlog = await blogService.create(blogData);
      setBlogs(blogs.concat(newBlog));
      setMessage(
        `A new blog was created: "${newBlog.title}" by ${newBlog.author}`
      );
      setTypeMessage('success');
      setTimeout(() => {
        setMessage(null);
        setTypeMessage(null);
      }, 5000);
    } catch (exception) {
      setMessage('Error creating blog');
      setTypeMessage('error');
      console.error(exception);
      setTimeout(() => {
        setMessage(null);
        setTypeMessage(null);
      }, 5000);
    }
  };

  const likeBlog = async (blog) => {
    try {
      const updatedBlog = await blogService.update(blog.id, {
        ...blog,
        likes: blog.likes + 1,
      });
      setBlogs(blogs.map((b) => (b.id === blog.id ? updatedBlog : b)));
      setMessage(`Liked blog: "${updatedBlog.title}" by ${updatedBlog.author}`);
      setTypeMessage('success');
      setTimeout(() => {
        setMessage(null);
        setTypeMessage(null);
      }, 5000);
    } catch (exception) {
      setMessage('Error updating blog');
      setTypeMessage('error');
      console.error(exception);
      setTimeout(() => {
        setMessage(null);
        setTypeMessage(null);
      }, 5000);
    }
  };

  const deleteBlog = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this blog?'
    );
    if (!confirmed) return;
    try {
      await blogService.remove(id);
      setBlogs(blogs.filter((b) => b.id !== id));
      setMessage(`Blog deleted`);
      setTypeMessage('success');
      setTimeout(() => {
        setMessage(null);
        setTypeMessage(null);
      }, 5000);
    } catch (exception) {
      setMessage('Error deleting blog');
      setTypeMessage('error');
      console.error(exception);
      setTimeout(() => {
        setMessage(null);
        setTypeMessage(null);
      }, 5000);
    }
  };

  const loginForm = () => (
    <LoginForm
      onSubmit={handleLogin}
      username={username}
      password={password}
      onUsernameChange={({ target }) => setUsername(target.value)}
      onPasswordChange={({ target }) => setPassword(target.value)}
    />
  );

  const blogFormRef = useRef();

  return (
    <div>
      <h1>Blog List</h1>
      <Notification message={message} type={typeMessage} />

      {user === null ? (
        loginForm()
      ) : (
        <div>
          <p>{user.name} logged-in</p>
          <button onClick={handleLogout}>logout</button>
          <h2>Create Blog</h2>
          <Togglable buttonLabel="new blog" ref={blogFormRef}>
            <BlogForm createBlog={createBlog} />
          </Togglable>
          <h2>blogs</h2>
          {blogs
            .sort((a, b) => b.likes - a.likes)
            .map((blog) => (
              <Blog
                key={blog.id}
                blog={blog}
                user={user}
                onLike={() => likeBlog(blog)}
                onDelete={() => deleteBlog(blog.id)}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default App;
