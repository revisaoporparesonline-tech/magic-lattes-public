import { useLattesController } from './controllers/useLattesController';
import { LattesView } from './views/LattesView';

export default function App() {
  const controller = useLattesController();
  return <LattesView {...controller} />;
}