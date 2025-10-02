import { useState, useEffect } from 'react';
import Blog from './components/Blog';
import blogService from './services/blogs';
import loginService from './services/login';
import Notification from './components/Notification';

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
    const loggedUserJSON = window.localStorage.getItem('loggedBlogappUser');
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

      window.localStorage.setItem('loggedBlogappUser', JSON.stringify(user));
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
    window.localStorage.removeItem('loggedBlogappUser');
    setUser(null);
    blogService.setToken(null);
  };

  const handleCreateBlog = async (event) => {
    event.preventDefault();
    const title = event.target.Title.value;
    const author = event.target.Author.value;
    const url = event.target.Url.value;

    try {
      const newBlog = await blogService.create({
        title,
        author,
        url,
      });
      setBlogs(blogs.concat(newBlog));
      setMessage(
        `A new blog was created: "${newBlog.title}" by ${newBlog.author}`
      );
      setTypeMessage('success');
      event.target.Title.value = '';
      event.target.Author.value = '';
      event.target.Url.value = '';
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

  const loginForm = () => (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <div>
        username
        <input
          type="text"
          value={username}
          name="Username"
          onChange={({ target }) => setUsername(target.value)}
        />
      </div>
      <div>
        password
        <input
          type="password"
          value={password}
          name="Password"
          onChange={({ target }) => setPassword(target.value)}
        />
      </div>
      <button type="submit">login</button>
    </form>
  );

  const blogForm = () => (
    <form onSubmit={handleCreateBlog}>
      <div>
        title:
        <input type="text" name="Title" />
      </div>
      <div>
        author:
        <input type="text" name="Author" />
      </div>
      <div>
        url:
        <input type="text" name="Url" />
      </div>
      <button type="submit">create</button>
    </form>
  );

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
          {blogForm()}
          <h2>blogs</h2>
          {blogs.map((blog) => (
            <Blog key={blog.id} blog={blog} />
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
