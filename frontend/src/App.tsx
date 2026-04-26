import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { BillTemplates } from './pages/BillTemplates';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="insights" element={<Insights />} />
          <Route path="bill-templates" element={<BillTemplates />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
