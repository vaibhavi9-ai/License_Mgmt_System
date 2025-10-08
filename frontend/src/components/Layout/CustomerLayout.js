import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout, getUser } from '../../services/auth';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { path: '/customer', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { path: '/customer/subscription-request', label: 'Request Subscription', icon: 'fas fa-plus-circle' },
    { path: '/customer/subscription-history', label: 'Subscription History', icon: 'fas fa-history' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="customer-layout">
      {/* Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-success">
        <div className="container-fluid">
          <a className="navbar-brand" href="/customer">
            <i className="fas fa-user-circle me-2"></i>
            Customer Portal
          </a>

          <div className="navbar-nav ms-auto">
            <div className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                <i className="fas fa-user me-2"></i>
                {user?.name || 'Customer'}
              </a>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>Logout
                </a></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <nav className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
            <div className="position-sticky pt-3">
              <ul className="nav flex-column">
                {menuItems.map((item) => (
                  <li key={item.path} className="nav-item">
                    <a 
                      className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(item.path);
                      }}
                    >
                      <i className={`${item.icon} me-2`}></i>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Main content */}
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <div className="pt-3 pb-2 mb-3">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CustomerLayout;