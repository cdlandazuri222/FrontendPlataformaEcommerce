import { AppRouter } from './ui/navigation/AppRouter';
import { PreferenciasProvider } from './ui/context/PreferenciasContext';

function App() {
  return (
    <PreferenciasProvider>
      <AppRouter />
    </PreferenciasProvider>
  );
}

export default App;
