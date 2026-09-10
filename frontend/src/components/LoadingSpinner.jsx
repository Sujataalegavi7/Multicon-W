const LoadingSpinner = ({ fullPage = false, size = 'default' }) => {
  const spinnerClass = `spinner ${size === 'lg' ? 'spinner-lg' : ''}`;

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <div className={spinnerClass} style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div className="loading-center">
      <div className={spinnerClass} />
    </div>
  );
};

export default LoadingSpinner;
