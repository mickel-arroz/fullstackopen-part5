// Generic notification component. Accepts message and type.
// type can be: 'error' | 'success' | 'info'
const Notification = ({ message, type }) => {
  if (!message) return null;

  return <div className={`notification ${type}`}>{message}</div>;
};

export default Notification;
