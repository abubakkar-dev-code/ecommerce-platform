
type ButtonProps = {
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

const Button = ({
  children,
  type = "button",
  disabled = false,
  onClick,
}: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="py-3 px-5 bg-primary text-white rounded-lg border-none"
    >
      {children}
    </button>
  );
};

export default Button