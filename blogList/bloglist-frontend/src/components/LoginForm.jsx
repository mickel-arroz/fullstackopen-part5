const LoginForm = ({
  onSubmit,
  username,
  password,
  onUsernameChange,
  onPasswordChange,
}) => (
  <form onSubmit={onSubmit}>
    <h2>Login</h2>
    <div>
      username
      <input
        id="username"
        type="text"
        value={username}
        name="Username"
        onChange={onUsernameChange}
      />
    </div>
    <div>
      password
      <input
        id="password"
        type="password"
        value={password}
        name="Password"
        onChange={onPasswordChange}
      />
    </div>
    <button type="submit">login</button>
  </form>
);

export default LoginForm;
