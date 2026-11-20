import { useState, type ComponentProps } from "react";

export default function PasswordInput(props: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return <div className="relative">
    <input {...props} type={visible ? "text" : "password"} className="store-input pr-20" />
    <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"}
      className="absolute inset-y-1 right-1 rounded-lg px-3 text-sm font-semibold text-primary">
      {visible ? "Hide" : "Show"}
    </button>
  </div>;
}
