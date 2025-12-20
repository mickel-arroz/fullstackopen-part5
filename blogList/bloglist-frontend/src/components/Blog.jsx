import { useState } from 'react';
import PropTypes from 'prop-types';

const Blog = ({ blog, onLike, onDelete, user }) => {
  const [showAll, setShowAll] = useState(false);

  const containerStyle = {
    border: '1px solid #ddd',
    borderRadius: 6,
    padding: '0.75rem',
    marginBottom: '0.75rem',
    background: showAll ? '#f3f8ff' : '#ffffff',
  };

  const titleRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    fontWeight: 600,
  };

  const detailsStyle = {
    marginTop: '0.5rem',
    lineHeight: 1.35,
  };

  return (
    <div className="blog" style={containerStyle}>
      <div style={titleRowStyle}>
        <span>
          {blog.title}{' '}
          <span style={{ fontWeight: 400, color: '#555', fontStyle: 'italic' }}>
            by {blog.author}
          </span>
        </span>
        <button onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'hide' : 'view'}
        </button>
      </div>

      {showAll && (
        <div style={detailsStyle}>
          <div>url: {blog.url}</div>
          <div>likes: {blog.likes ?? 0}</div>
          <button type="button" onClick={() => onLike(blog)}>
            like
          </button>
          <div>added by: {blog.user?.name ?? 'unknown'}</div>
          {blog.user && user && blog.user.username === user.username && (
            <button type="button" onClick={() => onDelete(blog.id)}>
              DELETE
            </button>
          )}
        </div>
      )}
    </div>
  );
};

Blog.propTypes = {
  blog: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    likes: PropTypes.number,
    user: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
    }),
  }).isRequired,
  onLike: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default Blog;
