import React, { useEffect, useState } from "react";
import { customerAPI } from "../../services/api";
import LoadingSpinner from "../Common/LoadingSpinner";
import { toast } from "react-toastify";

const SubscriptionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchHistory();
  }, [currentPage, sortOrder]);

  const fetchHistory = async () => {
    try {
      const response = await customerAPI.getSubscriptionHistory(currentPage, 10, sortOrder);
      setHistory(response.data.history || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      toast.error("Failed to load subscription history");
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleDeactivateSubscription = async (subscriptionId) => {
    if (!window.confirm("Are you sure you want to deactivate this subscription?")) {
      return;
    }

    setDeactivating(prev => ({ ...prev, [subscriptionId]: true }));
    try {
      await customerAPI.deactivateSubscription();
      toast.success("Subscription deactivated successfully!");
      // Refresh the history
      fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to deactivate subscription");
    } finally {
      setDeactivating(prev => ({ ...prev, [subscriptionId]: false }));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="subscription-history">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Subscription History</h2>
        <div className="d-flex gap-2">
          <label className="form-label">Sort by:</label>
          <select 
            className="form-select" 
            value={sortOrder} 
            onChange={handleSortChange}
            style={{ width: 'auto' }}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="card shadow">
        <div className="card-header">
          <h5 className="mb-0">Your Subscription History</h5>
        </div>
        <div className="card-body">
          {history.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Subscription Pack</th>
                      <th>Status</th>
                      <th>Price</th>
                      <th>Requested</th>
                      <th>Approved</th>
                      <th>Expires</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(subscription => (
                      <tr key={subscription.id}>
                        <td>
                          <div>
                            <strong className="text-primary">{subscription.pack_name}</strong>
                            <br />
                            <small className="text-muted">SKU: {subscription.pack_sku}</small>
                          </div>
                        </td>
                        <td>
                          <span className={getStatusBadge(subscription.status)}>
                            {subscription.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <strong>{formatCurrency(subscription.price)}</strong>
                          <br />
                          <small className="text-muted">per month</small>
                        </td>
                        <td>
                          <div>
                            {formatDate(subscription.requested_at)}
                          </div>
                        </td>
                        <td>
                          <div>
                            {subscription.approved_at ? formatDate(subscription.approved_at) : 'Pending'}
                          </div>
                        </td>
                        <td>
                          <div>
                            {subscription.expires_at ? formatDate(subscription.expires_at) : 'N/A'}
                          </div>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            {subscription.status === 'active' && (
                              <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDeactivateSubscription(subscription.id)}
                                disabled={deactivating[subscription.id]}
                                title="Deactivate Subscription"
                              >
                                {deactivating[subscription.id] ? (
                                  <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                  <i className="fas fa-times"></i>
                                )}
                              </button>
                            )}
                            {subscription.status === 'requested' && (
                              <span className="badge bg-warning">
                                <i className="fas fa-clock"></i> Pending Approval
                              </span>
                            )}
                            {subscription.status === 'expired' && (
                              <span className="badge bg-danger">
                                <i className="fas fa-exclamation-triangle"></i> Expired
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Subscription history pagination" className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-history fa-3x text-gray-300 mb-3"></i>
              <h5 className="text-gray-600">No Subscription History</h5>
              <p className="text-gray-500">You haven't made any subscription requests yet.</p>
              <a href="/customer/subscription-request" className="btn btn-primary">
                <i className="fas fa-plus"></i> Request Your First Subscription
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {history.length > 0 && (
        <div className="row mt-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title text-primary">{history.length}</h5>
                <p className="card-text">Total Requests</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title text-success">
                  {history.filter(h => h.status === 'active' || h.status === 'approved').length}
                </h5>
                <p className="card-text">Active Subscriptions</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title text-warning">
                  {history.filter(h => h.status === 'requested').length}
                </h5>
                <p className="card-text">Pending Requests</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title text-info">
                  {formatCurrency(history.reduce((sum, h) => sum + (h.price || 0), 0))}
                </h5>
                <p className="card-text">Total Spent</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionHistory;