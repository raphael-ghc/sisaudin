import api from './axiosInstance';

const API_URL = '/reunioes-busca-conjunta'; // Check controller, it maps to /api/reuniao-busca-conjunta and /api/reunioes-busca-conjunta

export const getReuniaoByItemTrabalho = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/reuniao-busca-conjunta/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar ReuniaoBuscaConjunta por itemTrabalho', error);
        throw error;
    }
};

export const getReuniaoById = async (id) => {
    try {
        const response = await api.get(`/reuniao-busca-conjunta/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar ReuniaoBuscaConjunta por id', error);
        throw error;
    }
};

export const createReuniao = async (data) => {
    try {
        const response = await api.post(`/reuniao-busca-conjunta`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar ReuniaoBuscaConjunta', error);
        throw error;
    }
};

export const updateReuniao = async (id, data) => {
    try {
        const response = await api.put(`/reuniao-busca-conjunta/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar ReuniaoBuscaConjunta', error);
        throw error;
    }
};

export const getAllReunioes = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/reuniao-busca-conjunta?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de ReuniaoBuscaConjunta', error);
        throw error;
    }
};

export const deleteReuniao = async (id) => {
    try {
        const response = await api.delete(`/reuniao-busca-conjunta/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao excluir ReuniaoBuscaConjunta', error);
        throw error;
    }
};
