import api from "./axiosInstance";

export const getAllUnidades = (page = 0, size = 10000) => {
  return api.get(`/unidade?page=${page}&size=${size}`);
};

/*
export const getAllUnidades = (page = 0, size = 10) => {
  return api.get(`/unidade?page=${page}&size=${size}`);
};*/

export const createUnidade = (data) => {
  return api.post("/unidade", data);
};

export const updateUnidade = (id, data) => {
  return api.put(`/unidade/${id}`, data);
};

export const patchUpdateUnidade = (id, data) => {
  return api.patch(`/unidade/${id}`, data);
};

export const deleteUnidade = (id) => {
  return api.delete(`/unidade/${id}`);
};