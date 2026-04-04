import { Link, useLocation } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">
          Rae Budget
        </Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link
              to="/"
              className={isActive('/') ? 'active' : ''}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/bill-templates"
              className={isActive('/bill-templates') ? 'active' : ''}
            >
              Bill Templates
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className={isActive('/settings') ? 'active' : ''}
            >
              Settings
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
