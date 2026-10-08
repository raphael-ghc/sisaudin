import api from './axiosInstance';

const API_URL = 'https://sisaudin.ghc.com.br/api/relatorios-preliminar';

// especial = true cria um REAI quando o item ainda não tem relatório; se já tem, o tipo existente prevalece
export const getRelatorioByItemTrabalho = async (itemTrabalhoId, especial = false) => {
    try {
        const response = await api.get(`/relatorios-preliminar/item/${itemTrabalhoId}${especial ? '?especial=true' : ''}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar RelatorioPreliminar', error);
        throw error;
    }
};

export const updateRelatorio = async (itemTrabalhoId, data) => {
    try {
        const response = await api.patch(`/relatorios-preliminar/item/${itemTrabalhoId}`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao salvar RelatorioPreliminar', error);
        throw error;
    }
};

export const getAllRelatorios = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/relatorios-preliminar?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de RelatorioPreliminar', error);
        throw error;
    }
};

export const deleteRelatorio = async (id) => {
    try {
        const response = await api.delete(`/relatorios-preliminar/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao excluir RelatorioPreliminar', error);
        throw error;
    }
};

export const createEmptyRelatorio = async (especial = false) => {
    try {
        const response = await api.post(`/relatorios-preliminar${especial ? '?especial=true' : ''}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar RelatorioPreliminar vazio', error);
        throw error;
    }
};

export const createFromRelatorioPreliminar = async (itemTrabalhoId) => {
    try {
        const response = await api.post(`/relatorios-preliminar/create-from-preliminar/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar relatorio preliminar a partir do preliminar', error);
        throw error;
    }
};

export const getRelatorioById = async (id) => {
    try {
        const response = await api.get(`/relatorios-preliminar/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar RelatorioPreliminar por id', error);
        throw error;
    }
};

export const updateRelatorioById = async (id, data, itemTrabalhoId = null) => {
    try {
        const url = itemTrabalhoId ? `/relatorios-preliminar/${id}?itemTrabalhoId=${itemTrabalhoId}` : `/relatorios-preliminar/${id}`;
        const response = await api.patch(url, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar RelatorioPreliminar por id', error);
        throw error;
    }
};
