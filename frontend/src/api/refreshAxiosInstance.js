import axios from "axios";

import { API_BASE } from "./config";

const refreshApi = axios.create({
  baseURL: `${API_BASE}/api`,
});

export default refreshApi;
