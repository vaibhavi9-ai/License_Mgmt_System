import React, { useState, useEffect } from 'react';
import { customerAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CustomerDashboard = () => {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch current subscription
      try {
        const subscriptionResponse = await customerAPI.getCurrentSubscription();
        setCurrentSubscription(subscriptionResponse.data.subscription);
      } catch (error) {
        // No active subscription found - this is normal for new customers
        setCurrentSubscription(null);
      }

      // Fetch subscription history
      const historyResponse = await customerAPI.getSubscriptionHistory(1, 5);
      setSubscriptionHistory(historyResponse.data.history || []);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      requested: 'warning',
      approved: 'success',
      active: 'success',
      inactive: 'secondary',
      expired: 'danger'
    };
    return `badge bg-${badges[status] || 'secondary'}`;
  };

  return (
    <div className="customer-dashboard fade-in">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Dashboard</h1>
      </div>

      {/* Current Subscription Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Current Subscription</h6>
            </div>
            <div className="card-body">
              {currentSubscription ? (
                <div className="row">
                  <div className="col-md-6">
                    <h5 className="text-primary">{currentSubscription.pack_name}</h5>
                    <p className="text-muted">SKU: {currentSubscription.pack_sku}</p>
                    <p className="text-muted">Price: {formatCurrency(currentSubscription.price)}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Status:</strong> 
                      <span className={`ms-2 ${getStatusBadge(currentSubscription.status)}`}>
                        {currentSubscription.status.toUpperCase()}
                      </span>
                    </p>
                    <p><strong>Requested:</strong> {formatDate(currentSubscription.requested_at)}</p>
                    <p><strong>Approved:</strong> {formatDate(currentSubscription.approved_at)}</p>
                    <p><strong>Expires:</strong> {formatDate(currentSubscription.expires_at)}</p>
                    {currentSubscription.is_valid === false && (
                      <div className="alert alert-warning mt-2">
                        <i className="fas fa-exclamation-triangle"></i> This subscription has expired
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-box-open fa-3x text-gray-300 mb-3"></i>
                  <h5 className="text-gray-600">No Active Subscription</h5>
                  <p className="text-gray-500">You don't have an active subscription yet.</p>
                  <a href="/customer/subscription-request" className="btn btn-primary">
                    <i className="fas fa-plus"></i> Request Subscription
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Current Plan
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {currentSubscription ? currentSubscription.pack_name : 'None'}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-box fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Status
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {currentSubscription ? currentSubscription.status : 'Inactive'}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-info shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Total Requests
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {subscriptionHistory.length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-history fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-warning shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Monthly Cost
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {currentSubscription ? formatCurrency(currentSubscription.price) : '$0.00'}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-dollar-sign fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Subscription History */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Recent Subscription History</h6>
            </div>
            <div className="card-body">
              {subscriptionHistory.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Subscription Pack</th>
                        <th>Status</th>
                        <th>Requested</th>
                        <th>Approved</th>
                        <th>Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptionHistory.map((subscription) => (
                        <tr key={subscription.id}>
                          <td>
                            <strong>{subscription.pack_name}</strong>
                            <br />
                            <small className="text-muted">{subscription.pack_sku}</small>
                          </td>
                          <td>
                            <span className={getStatusBadge(subscription.status)}>
                              {subscription.status.toUpperCase()}
                            </span>
                          </td>
                          <td>{formatDate(subscription.requested_at)}</td>
                          <td>{formatDate(subscription.approved_at)}</td>
                          <td>{formatDate(subscription.expires_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-inbox fa-3x text-gray-300 mb-3"></i>
                  <p className="text-gray-600">No subscription history</p>
                  <p className="text-gray-500">You haven't made any subscription requests yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;