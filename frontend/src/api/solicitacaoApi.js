import api from './axiosInstance';

export const getSolicitacaoByItemTrabalho = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/solicitacoes/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar Solicitacao por item', error);
        throw error;
    }
};

export const getAllSolicitacoes = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/solicitacoes?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de Solicitacao', error);
        throw error;
    }
};

export const deleteSolicitacao = async (id) => {
    try {
        const response = await api.delete(`/solicitacoes/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao excluir Solicitacao', error);
        throw error;
    }
};

export const createEmptySolicitacao = async () => {
    try {
        const response = await api.post(`/solicitacoes`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar Solicitacao vazia', error);
        throw error;
    }
};

export const getSolicitacaoById = async (id) => {
    try {
        const response = await api.get(`/solicitacoes/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar Solicitacao por id', error);
        throw error;
    }
};

export const updateSolicitacaoById = async (id, solicitacaoData, itemTrabalhoId = null) => {
    try {
        const params = itemTrabalhoId ? `?itemTrabalhoId=${itemTrabalhoId}` : '';
        const response = await api.patch(`/solicitacoes/${id}${params}`, solicitacaoData);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar Solicitacao por id', error);
        throw error;
    }
};
