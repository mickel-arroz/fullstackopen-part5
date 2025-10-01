const info = (...params) => {
  console.log(...params);
};

const error = (...params) => {
  if (process.env.NODE_ENV === 'test') {
    const msg = params.join(' ');
    if (msg.includes('Cast to ObjectId failed')) {
      // Silenciamos errores de id malformado esperados en tests
      return;
    }
  }
  console.error(...params);
};

module.exports = {
  info,
  error,
};
