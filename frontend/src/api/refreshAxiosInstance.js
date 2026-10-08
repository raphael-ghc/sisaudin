import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

const refreshApi = axios.create({
  baseURL: `https://sisaudin.ghc.com.br:8080/api`,
});

export default refreshApi;
