import api from "./axiosInstance";

export const getAllGerencias = (page = 0, size = 10000) => {
  return api.get(`/gerencia?page=${page}&size=${size}`);
};

/*
export const getAllGerencias = (page = 0, size = 10) => {
  return api.get(`/gerencia?page=${page}&size=${size}`);
};*/

export const createGerencia = (data) => {
  return api.post("/gerencia", data);
};

export const updateGerencia = (id, data) => {
  return api.put(`/gerencia/${id}`, data);
};

export const patchUpdateGerencia = (id, data) => {
  return api.patch(`/gerencia/${id}`, data);
};

export const deleteGerencia = (id) => {
  return api.delete(`/gerencia/${id}`);
};

export const getByIdGerencia = (id) => {
  return api.put(`/gerencia/${id}`);
};