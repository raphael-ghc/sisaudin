import api from './axiosInstance';

const API_URL = 'https://sisaudin.ghc.com.br/api/relatorios-final';

export const getRelatorioByItemTrabalho = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/relatorios-final/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar RelatorioFinal', error);
        throw error;
    }
};

export const updateRelatorio = async (itemTrabalhoId, data) => {
    try {
        const response = await api.patch(`/relatorios-final/item/${itemTrabalhoId}`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao salvar RelatorioFinal', error);
        throw error;
    }
};

export const getAllRelatorios = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/relatorios-final?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de RelatorioFinal', error);
        throw error;
    }
};

export const deleteRelatorio = async (id) => {
    try {
        const response = await api.delete(`/relatorios-final/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao excluir RelatorioFinal', error);
        throw error;
    }
};

export const createEmptyRelatorio = async () => {
    try {
        const response = await api.post(`/relatorios-final`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar RelatorioFinal vazio', error);
        throw error;
    }
};

export const createFromRelatorioPreliminar = async (itemTrabalhoId) => {
    try {
        const response = await api.post(`/relatorios-final/create-from-preliminar/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar relatorio final a partir do preliminar', error);
        throw error;
    }
};

export const getRelatorioById = async (id) => {
    try {
        const response = await api.get(`/relatorios-final/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar RelatorioFinal por id', error);
        throw error;
    }
};

export const updateRelatorioById = async (id, data, itemTrabalhoId = null) => {
    try {
        const url = itemTrabalhoId ? `/relatorios-final/${id}?itemTrabalhoId=${itemTrabalhoId}` : `/relatorios-final/${id}`;
        const response = await api.patch(url, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar RelatorioFinal por id', error);
        throw error;
    }
};
