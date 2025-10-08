import React, { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../Common/LoadingSpinner";
import { toast } from "react-toastify";

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [packs, setPacks] = useState([]);
  const [assignFormData, setAssignFormData] = useState({
    pack_id: ""
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchCustomers();
    fetchPacks();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSubscriptions = async () => {
    try {
      const response = await adminAPI.getSubscriptions(1, 10, statusFilter);
      setSubscriptions(response.data.subscriptions || []);
    } catch (error) {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await adminAPI.getCustomers(1, 100);
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
  };

  const fetchPacks = async () => {
    try {
      const response = await adminAPI.getSubscriptionPacks(1, 100);
      setPacks(response.data.subscription_packs || []);
    } catch (error) {
      console.error("Failed to load packs:", error);
    }
  };

  const handleApproveSubscription = async (subscriptionId) => {
    if (window.confirm("Are you sure you want to approve this subscription?")) {
      try {
        await adminAPI.approveSubscription(subscriptionId);
        toast.success("Subscription approved successfully");
        fetchSubscriptions();
      } catch (error) {
        toast.error(error.response?.data?.detail || "Failed to approve subscription");
      }
    }
  };

  const handleAssignSubscription = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.assignSubscription(selectedCustomer.id, parseInt(assignFormData.pack_id));
      toast.success("Subscription assigned successfully");
      setShowAssignModal(false);
      setSelectedCustomer(null);
      setAssignFormData({ pack_id: "" });
      fetchSubscriptions();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to assign subscription");
    }
  };

  const openAssignModal = (customer) => {
    setSelectedCustomer(customer);
    setAssignFormData({ pack_id: "" });
    setShowAssignModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      requested: "warning",
      approved: "success",
      active: "success",
      inactive: "secondary",
      expired: "danger"
    };
    return `badge bg-${badges[status] || 'secondary'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="subscription-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Subscriptions</h2>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead className="table-dark">
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Pack</th>
              <th>Price</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Approved</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map(subscription => (
              <tr key={subscription.id}>
                <td>{subscription.customer_name}</td>
                <td>{subscription.customer_email}</td>
                <td>{subscription.pack_name}</td>
                <td>${subscription.price}</td>
                <td>
                  <span className={getStatusBadge(subscription.status)}>
                    {subscription.status.toUpperCase()}
                  </span>
                </td>
                <td>{formatDate(subscription.requested_at)}</td>
                <td>{formatDate(subscription.approved_at)}</td>
                <td>{formatDate(subscription.expires_at)}</td>
                <td>
                  {subscription.status === "requested" && (
                    <button
                      className="btn btn-sm btn-success me-2"
                      onClick={() => handleApproveSubscription(subscription.id)}
                    >
                      <i className="fas fa-check"></i> Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Assign Section */}
      <div className="mt-5">
        <h4>Quick Assign Subscription</h4>
        <div className="table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.slice(0, 5).map(customer => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => openAssignModal(customer)}
                    >
                      <i className="fas fa-plus"></i> Assign Pack
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Subscription Modal */}
      {showAssignModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Assign Subscription to {selectedCustomer?.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAssignModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAssignSubscription}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Select Subscription Pack</label>
                    <select
                      className="form-select"
                      value={assignFormData.pack_id}
                      onChange={(e) => setAssignFormData({...assignFormData, pack_id: e.target.value})}
                      required
                    >
                      <option value="">Choose a pack...</option>
                      {packs.map(pack => (
                        <option key={pack.id} value={pack.id}>
                          {pack.name} - ${pack.price} ({pack.validity_months} months)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAssignModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Assign Subscription
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;