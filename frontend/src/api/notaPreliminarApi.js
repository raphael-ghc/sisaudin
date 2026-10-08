import api from './axiosInstance';

const API_URL = 'https://sisaudin.ghc.com.br/api/notas-preliminar';

export const getRelatorioByItemTrabalho = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/notas-preliminar/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar NotaPreliminar', error);
        throw error;
    }
};

export const updateRelatorio = async (itemTrabalhoId, data) => {
    try {
        const response = await api.patch(`/notas-preliminar/item/${itemTrabalhoId}`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao salvar NotaPreliminar', error);
        throw error;
    }
};

export const getAllRelatorios = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/notas-preliminar?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de NotaPreliminar', error);
        throw error;
    }
};

export const deleteRelatorio = async (id) => {
    try {
        const response = await api.delete(`/notas-preliminar/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao excluir NotaPreliminar', error);
        throw error;
    }
};

export const createEmptyRelatorio = async () => {
    try {
        const response = await api.post(`/notas-preliminar`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar NotaPreliminar vazio', error);
        throw error;
    }
};

export const createFromRelatorioPreliminar = async (itemTrabalhoId) => {
    try {
        const response = await api.post(`/notas-preliminar/create-from-preliminar/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar nota preliminar a partir do preliminar', error);
        throw error;
    }
};

export const getRelatorioById = async (id) => {
    try {
        const response = await api.get(`/notas-preliminar/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar NotaPreliminar por id', error);
        throw error;
    }
};

export const updateRelatorioById = async (id, data, itemTrabalhoId = null) => {
    try {
        const url = itemTrabalhoId ? `/notas-preliminar/${id}?itemTrabalhoId=${itemTrabalhoId}` : `/notas-preliminar/${id}`;
        const response = await api.patch(url, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar NotaPreliminar por id', error);
        throw error;
    }
};
