import React, { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../Common/LoadingSpinner";
import { toast } from "react-toastify";

const SubscriptionPackManagement = () => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPack, setEditingPack] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    validity_months: ""
  });

  useEffect(() => {
    fetchPacks();
  }, [searchTerm]);

  const fetchPacks = async () => {
    try {
      const response = await adminAPI.getSubscriptionPacks(1, 10);
      setPacks(response.data.subscription_packs || []);
    } catch (error) {
      toast.error("Failed to load subscription packs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePack = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createSubscriptionPack({
        ...formData,
        price: parseFloat(formData.price),
        validity_months: parseInt(formData.validity_months)
      });
      toast.success("Subscription pack created successfully");
      setShowCreateModal(false);
      setFormData({ name: "", description: "", sku: "", price: "", validity_months: "" });
      fetchPacks();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create subscription pack");
    }
  };

  const handleEditPack = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateSubscriptionPack(editingPack.id, {
        ...formData,
        price: parseFloat(formData.price),
        validity_months: parseInt(formData.validity_months)
      });
      toast.success("Subscription pack updated successfully");
      setShowEditModal(false);
      setEditingPack(null);
      setFormData({ name: "", description: "", sku: "", price: "", validity_months: "" });
      fetchPacks();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update subscription pack");
    }
  };

  const handleDeletePack = async (packId) => {
    if (window.confirm("Are you sure you want to delete this subscription pack?")) {
      try {
        await adminAPI.deleteSubscriptionPack(packId);
        toast.success("Subscription pack deleted successfully");
        fetchPacks();
      } catch (error) {
        toast.error(error.response?.data?.detail || "Failed to delete subscription pack");
      }
    }
  };

  const openEditModal = (pack) => {
    setEditingPack(pack);
    setFormData({
      name: pack.name,
      description: pack.description,
      sku: pack.sku,
      price: pack.price.toString(),
      validity_months: pack.validity_months.toString()
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setFormData({ name: "", description: "", sku: "", price: "", validity_months: "" });
    setShowCreateModal(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="subscription-pack-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Subscription Packs</h2>
        <button 
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          <i className="fas fa-plus"></i> Add Pack
        </button>
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search subscription packs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Packs Table */}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Description</th>
              <th>Price</th>
              <th>Validity (Months)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {packs.map(pack => (
              <tr key={pack.id}>
                <td>{pack.name}</td>
                <td><code>{pack.sku}</code></td>
                <td>{pack.description}</td>
                <td>${pack.price}</td>
                <td>{pack.validity_months}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => openEditModal(pack)}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeletePack(pack.id)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Pack Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Subscription Pack</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreatePack}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">SKU</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.sku}
                          onChange={(e) => setFormData({...formData, sku: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Validity (Months)</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          className="form-control"
                          value={formData.validity_months}
                          onChange={(e) => setFormData({...formData, validity_months: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Pack
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pack Modal */}
      {showEditModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Subscription Pack</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <form onSubmit={handleEditPack}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">SKU</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.sku}
                          onChange={(e) => setFormData({...formData, sku: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Validity (Months)</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          className="form-control"
                          value={formData.validity_months}
                          onChange={(e) => setFormData({...formData, validity_months: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Pack
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

export default SubscriptionPackManagement;