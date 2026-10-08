import api from './axiosInstance';

export const getMatrizAchadosByItemTrabalho = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/matriz-achados/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar Matriz de Achados por item', error);
        throw error;
    }
};

export const getAllMatrizesAchados = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/matriz-achados?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de Matrizes de Achados', error);
        throw error;
    }
};

export const getMatrizAchadosById = async (id) => {
    try {
        const response = await api.get(`/matriz-achados/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar Matriz de Achados por id', error);
        throw error;
    }
};

export const createMatrizAchados = async (data) => {
    try {
        const response = await api.post(`/matriz-achados`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar Matriz de Achados', error);
        throw error;
    }
};

export const updateMatrizAchados = async (id, data) => {
    try {
        const response = await api.put(`/matriz-achados/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar Matriz de Achados', error);
        throw error;
    }
};

export const deleteMatrizAchados = async (id) => {
    try {
        const response = await api.delete(`/matriz-achados/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao deletar Matriz de Achados', error);
        throw error;
    }
};
