import api from "./axiosInstance";

export const getAllItensTrabalho = (page = 0, size = 10000) => {
  return api.get(`/item-trabalho?page=${page}&size=${size}`);
};

export const getItemTrabalhoById = (id) => {
  return api.get(`/item-trabalho/${id}`);
};

export const createItemTrabalho = (data) => {
  return api.post("/item-trabalho", data);
};

export const updateItemTrabalho = (id, data) => {
  return api.put(`/item-trabalho/${id}`, data);
};

export const patchUpdateItemTrabalho = (id, data) => {
  return api.patch(`/item-trabalho/${id}`, data);
};

export const deleteItemTrabalho = (id) => {
  return api.delete(`/item-trabalho/${id}`);
};
