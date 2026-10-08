import api from './axiosInstance';

const API_URL = 'https://sisaudin.ghc.com.br/api/pareceres';

export const getRelatorioByItemTrabalho = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/pareceres/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar Parecer', error);
        throw error;
    }
};

export const updateRelatorio = async (itemTrabalhoId, data) => {
    try {
        const response = await api.patch(`/pareceres/item/${itemTrabalhoId}`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao salvar Parecer', error);
        throw error;
    }
};

export const getAllRelatorios = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/pareceres?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de Parecer', error);
        throw error;
    }
};

export const deleteRelatorio = async (id) => {
    try {
        const response = await api.delete(`/pareceres/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao excluir Parecer', error);
        throw error;
    }
};

export const createEmptyRelatorio = async () => {
    try {
        const response = await api.post(`/pareceres`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar Parecer vazio', error);
        throw error;
    }
};

export const createFromRelatorioPreliminar = async (itemTrabalhoId) => {
    try {
        const response = await api.post(`/pareceres/create-from-preliminar/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar parecer preliminar a partir do preliminar', error);
        throw error;
    }
};

export const getRelatorioById = async (id) => {
    try {
        const response = await api.get(`/pareceres/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar Parecer por id', error);
        throw error;
    }
};

export const updateRelatorioById = async (id, data, itemTrabalhoId = null) => {
    try {
        const url = itemTrabalhoId ? `/pareceres/${id}?itemTrabalhoId=${itemTrabalhoId}` : `/pareceres/${id}`;
        const response = await api.patch(url, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar Parecer por id', error);
        throw error;
    }
};
