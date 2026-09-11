import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('electronica-tech-token');

  if (!token) return <Navigate to="/pages/login" replace state={{ from: location }} />;
  return children;
}
