import { useEffect } from "react";
import { toast } from "react-toastify";

const defaultOptions = {
  position: "bottom-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "colored",
};

export const notify = {
  success: (message) => toast.success(message, defaultOptions),
  error: (message) => toast.error(message, defaultOptions),
  info: (message) => toast.info(message, defaultOptions),
  warning: (message) => toast.warn(message, defaultOptions),
};

export function useNotifyError(error) {
  useEffect(() => {
    if (!error) return;
    notify.error(error);
  }, [error]);
}
