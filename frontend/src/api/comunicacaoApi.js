import api from './axiosInstance';

export const getComunicacaoByItemTrabalho = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/comunicacoes/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar Comunicacao por item', error);
        throw error;
    }
};

export const getAllComunicacoes = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/comunicacoes?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de Comunicacao', error);
        throw error;
    }
};

export const deleteComunicacao = async (id) => {
    try {
        const response = await api.delete(`/comunicacoes/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao excluir Comunicacao', error);
        throw error;
    }
};

export const createEmptyComunicacao = async () => {
    try {
        const response = await api.post(`/comunicacoes`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar Comunicacao vazia', error);
        throw error;
    }
};

export const getComunicacaoById = async (id) => {
    try {
        const response = await api.get(`/comunicacoes/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar Comunicacao por id', error);
        throw error;
    }
};

export const updateComunicacaoById = async (id, comunicacaoData, itemTrabalhoId = null) => {
    try {
        const params = itemTrabalhoId ? `?itemTrabalhoId=${itemTrabalhoId}` : '';
        const response = await api.patch(`/comunicacoes/${id}${params}`, comunicacaoData);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar Comunicacao por id', error);
        throw error;
    }
};
