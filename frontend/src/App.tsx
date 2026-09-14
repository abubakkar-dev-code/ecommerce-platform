import AuthInitializer from "./components/common/AuthInitializer";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <div>
      <AuthInitializer />
      <AppRoutes />
    </div>
  );
};

export default App;
