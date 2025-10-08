import { useState } from "react";
import axios from "axios";

export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const callApi = async (config) => {
    setLoading(true); setError(null);
    try { const r = await axios(config); return r.data; }
    catch (e) { setError(e); throw e; }
    finally { setLoading(false); }
  };
  return { callApi, loading, error };
}
