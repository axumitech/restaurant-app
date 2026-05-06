import { Toaster as SonnerToaster } from 'sonner';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import PageNotFound from './lib/PageNotFound';
import Menu from './pages/Menu';
import Panier from './pages/Panier';
import Admin from './pages/Admin';
import AdminProduits from './pages/AdminProduits';
import AdminLogin from './pages/AdminLogin';
import AdminValidation from './pages/AdminValidation';
import ProtectedAdminRoute from './components/Admin/ProtectedAdminRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/panier" element={<Panier />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/produits" element={<AdminProduits />} />
          <Route path="/admin/validation" element={<AdminValidation />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <SonnerToaster position="top-center" theme="dark" />
    </Router>
  );
}

export default App;
