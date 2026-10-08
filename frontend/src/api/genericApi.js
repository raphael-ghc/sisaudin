import api from "./axiosInstance";

// Busca todos os registros da entidade (ex: /macroprocesso)
export const getAllGeneric = (entidade, page = 0, size = 10000) => {
  return api.get(`/${entidade}?page=${page}&size=${size}`);
};

// Cria um novo registro
export const createGeneric = (entidade, data) => {
  return api.post(`/${entidade}`, data);
};

// Atualiza um registro completo (PUT)
export const updateGeneric = (entidade, id, data) => {
  return api.put(`/${entidade}/${id}`, data);
};

// Deleta um registro por ID
export const deleteGeneric = (entidade, id) => {
  return api.delete(`/${entidade}/${id}`);
};