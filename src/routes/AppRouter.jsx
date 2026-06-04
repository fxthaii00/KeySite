import { Routes, Route } from 'react-router-dom';
import KeygenPage    from '../pages/KeygenPage';
import CreditsPage   from '../pages/CreditsPage';
import AboutPage     from '../pages/AboutPage';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage  from '../pages/NotFoundPage';

/**
 * AppRouter — centralized route definitions.
 * Add new routes here only; no routing logic in individual pages.
 */
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/"          element={<KeygenPage    />} />
      <Route path="/credits"   element={<CreditsPage   />} />
      <Route path="/about"     element={<AboutPage     />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*"          element={<NotFoundPage  />} />
    </Routes>
  );
}
