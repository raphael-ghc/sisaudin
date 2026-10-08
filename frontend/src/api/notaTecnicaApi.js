import api from './axiosInstance';

const API_URL = 'https://sisaudin.ghc.com.br/api/notas-tecnicas';

export const getRelatorioByItemTrabalho = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/notas-tecnicas/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar NotaTecnica', error);
        throw error;
    }
};

export const updateRelatorio = async (itemTrabalhoId, data) => {
    try {
        const response = await api.patch(`/notas-tecnicas/item/${itemTrabalhoId}`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao salvar NotaTecnica', error);
        throw error;
    }
};

export const getAllRelatorios = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/notas-tecnicas?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de NotaTecnica', error);
        throw error;
    }
};

export const deleteRelatorio = async (id) => {
    try {
        const response = await api.delete(`/notas-tecnicas/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao excluir NotaTecnica', error);
        throw error;
    }
};

export const createEmptyRelatorio = async () => {
    try {
        const response = await api.post(`/notas-tecnicas`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar NotaTecnica vazio', error);
        throw error;
    }
};

export const createFromRelatorioPreliminar = async (itemTrabalhoId) => {
    try {
        const response = await api.post(`/notas-tecnicas/create-from-preliminar/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar nota preliminar a partir do preliminar', error);
        throw error;
    }
};

export const getRelatorioById = async (id) => {
    try {
        const response = await api.get(`/notas-tecnicas/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar NotaTecnica por id', error);
        throw error;
    }
};

export const updateRelatorioById = async (id, data, itemTrabalhoId = null) => {
    try {
        const url = itemTrabalhoId ? `/notas-tecnicas/${id}?itemTrabalhoId=${itemTrabalhoId}` : `/notas-tecnicas/${id}`;
        const response = await api.patch(url, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar NotaTecnica por id', error);
        throw error;
    }
};
