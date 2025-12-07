// Generic notification component. Accepts message and type.
// type can be: 'error' | 'success' | 'info'

import PropTypes from 'prop-types';

const Notification = ({ message, type }) => {
  if (!message) return null;

  return (
    <div id="notification" className={`notification ${type}`}>
      {message}
    </div>
  );
};

Notification.propTypes = {
  message: PropTypes.string,
  type: PropTypes.string,
};

export default Notification;
