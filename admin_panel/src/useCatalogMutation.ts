import { useRef, useState } from "react";
import { errorMessage } from "./adminApi";

export default function useCatalogMutation() {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const mutate = async (action: () => Promise<unknown>, message: string) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await action();
      setNotice(message);
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return { busy, notice, error, setError, revision, mutate };
}
