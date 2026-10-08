import api from './axiosInstance';

const API_URL = 'https://sisaudin.ghc.com.br/api/notas-final';

export const getRelatorioByItemTrabalho = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/notas-final/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar NotaFinal', error);
        throw error;
    }
};

export const updateRelatorio = async (itemTrabalhoId, data) => {
    try {
        const response = await api.patch(`/notas-final/item/${itemTrabalhoId}`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao salvar NotaFinal', error);
        throw error;
    }
};

export const getAllRelatorios = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/notas-final?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de NotaFinal', error);
        throw error;
    }
};

export const deleteRelatorio = async (id) => {
    try {
        const response = await api.delete(`/notas-final/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao excluir NotaFinal', error);
        throw error;
    }
};

export const createEmptyRelatorio = async () => {
    try {
        const response = await api.post(`/notas-final`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar NotaFinal vazio', error);
        throw error;
    }
};

export const createFromRelatorioPreliminar = async (itemTrabalhoId) => {
    try {
        const response = await api.post(`/notas-final/create-from-preliminar/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar nota final a partir do preliminar', error);
        throw error;
    }
};

export const getRelatorioById = async (id) => {
    try {
        const response = await api.get(`/notas-final/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar NotaFinal por id', error);
        throw error;
    }
};

export const updateRelatorioById = async (id, data, itemTrabalhoId = null) => {
    try {
        const url = itemTrabalhoId ? `/notas-final/${id}?itemTrabalhoId=${itemTrabalhoId}` : `/notas-final/${id}`;
        const response = await api.patch(url, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar NotaFinal por id', error);
        throw error;
    }
};
