const GoogleButton = () => {
  return (
    <button
      type="button"
      onClick={() =>
        (window.location.href = "http://localhost:5000/api/users/google")
      }
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 font-medium text-text hover:bg-background"
    >
      <span className="text-lg font-bold">G</span>
      Continue with Google
    </button>
  );
};

export default GoogleButton;
