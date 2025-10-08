import React, { useState, useEffect } from "react";
import { customerAPI } from "../../services/api";
import LoadingSpinner from "../Common/LoadingSpinner";
import { toast } from "react-toastify";

const SubscriptionRequest = () => {
  const [packs, setPacks] = useState([]);
  const [selectedSku, setSelectedSku] = useState("");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch available subscription packs
      const packsResponse = await customerAPI.getAvailableSubscriptionPacks();
      setPacks(packsResponse.data.subscription_packs || []);

      // Check if customer already has an active subscription
      try {
        const subscriptionResponse = await customerAPI.getCurrentSubscription();
        setCurrentSubscription(subscriptionResponse.data.subscription);
      } catch (error) {
        // No active subscription - this is normal
        setCurrentSubscription(null);
      }
    } catch (error) {
      toast.error("Failed to load subscription packs");
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!selectedSku) {
      toast.error("Please select a subscription plan");
      return;
    }

    if (currentSubscription) {
      toast.error("You already have an active subscription. Please deactivate it first.");
      return;
    }

    setRequesting(true);
    try {
      await customerAPI.requestSubscription(selectedSku);
      toast.success("Subscription request submitted successfully! Please wait for admin approval.");
      setSelectedSku("");
      // Refresh current subscription status
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit subscription request");
    } finally {
      setRequesting(false);
    }
  };

  const handleDeactivateSubscription = async () => {
    if (!window.confirm("Are you sure you want to deactivate your current subscription?")) {
      return;
    }

    setDeactivating(true);
    try {
      await customerAPI.deactivateSubscription();
      toast.success("Subscription deactivated successfully!");
      // Refresh current subscription status
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to deactivate subscription");
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="subscription-request">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Request Subscription</h2>
      </div>

      {/* Current Subscription Alert */}
      {currentSubscription && (
        <div className="alert alert-info mb-4">
          <h5><i className="fas fa-info-circle"></i> Current Subscription</h5>
          <p>You currently have an active subscription:</p>
          <ul className="mb-0">
            <li><strong>Plan:</strong> {currentSubscription.pack_name}</li>
            <li><strong>Status:</strong> {currentSubscription.status}</li>
            <li><strong>Expires:</strong> {currentSubscription.expires_at ? new Date(currentSubscription.expires_at).toLocaleDateString() : 'N/A'}</li>
          </ul>
          <p className="mt-2 mb-0">
            <small>To request a new subscription, please deactivate your current one first.</small>
          </p>
        </div>
      )}

      {/* Subscription Request Form */}
      <div className="card shadow">
        <div className="card-header">
          <h5 className="mb-0">Select Subscription Plan</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleRequest}>
            <div className="mb-4">
              <label className="form-label">Choose a subscription plan:</label>
              <select 
                className="form-select form-select-lg"
                value={selectedSku} 
                onChange={(e) => setSelectedSku(e.target.value)}
                disabled={currentSubscription !== null}
                required
              >
                <option value="">-- Select a plan --</option>
                {packs.map(pack => (
                  <option key={pack.sku} value={pack.sku}>
                    {pack.name} - {pack.description} (${pack.price}/month, {pack.validity_months} month{pack.validity_months > 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Plan Details */}
            {selectedSku && (
              <div className="alert alert-light mb-4">
                {(() => {
                  const selectedPack = packs.find(pack => pack.sku === selectedSku);
                  return selectedPack ? (
                    <div>
                      <h6 className="text-primary">{selectedPack.name}</h6>
                      <p className="mb-2">{selectedPack.description}</p>
                      <div className="row">
                        <div className="col-md-6">
                          <p><strong>Price:</strong> ${selectedPack.price}/month</p>
                        </div>
                        <div className="col-md-6">
                          <p><strong>Validity:</strong> {selectedPack.validity_months} month{selectedPack.validity_months > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <div className="d-flex gap-2">
              <button 
                type="submit" 
                className="btn btn-primary btn-lg"
                disabled={requesting || currentSubscription !== null}
              >
                {requesting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Submitting Request...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> Submit Request
                  </>
                )}
              </button>
              
              {currentSubscription && (
                <button 
                  type="button" 
                  className="btn btn-outline-danger btn-lg"
                  onClick={handleDeactivateSubscription}
                  disabled={deactivating}
                >
                  {deactivating ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Deactivating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-times"></i> Deactivate Current
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Available Plans Overview */}
      <div className="mt-5">
        <h4>Available Subscription Plans</h4>
        <div className="row">
          {packs.map(pack => (
            <div key={pack.sku} className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title text-primary">{pack.name}</h5>
                  <p className="card-text">{pack.description}</p>
                  <div className="mb-3">
                    <h3 className="text-success">${pack.price}</h3>
                    <small className="text-muted">per month</small>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">
                      <i className="fas fa-calendar"></i> Valid for {pack.validity_months} month{pack.validity_months > 1 ? 's' : ''}
                    </small>
                  </div>
                  <button 
                    className="btn btn-outline-primary w-100"
                    onClick={() => setSelectedSku(pack.sku)}
                    disabled={currentSubscription !== null}
                  >
                    {currentSubscription ? 'Currently Active' : 'Select Plan'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRequest;