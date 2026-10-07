import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <div>
      <Toaster toastOptions={{ duration: 2000 }} />
      <AppRoutes />
    </div>
  );
};

export default App;
