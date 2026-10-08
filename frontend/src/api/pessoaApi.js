import api from "./axiosInstance";

export const getAllPessoas = (page = 0, size = 10000) => {
  return api.get(`/pessoa?page=${page}&size=${size}`);
};

export const createPessoa = (data) => {
  return api.post("/pessoa", data);
};

export const updatePessoa = (id, data) => {
  return api.put(`/pessoa/${id}`, data);
};

export const patchUpdatePessoa = (id, data) => {
  return api.patch(`/pessoa/${id}`, data);
};

export const deletePessoa = (id) => {
  return api.delete(`/pessoa/${id}`);
};