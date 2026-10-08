import api from './axiosInstance';

export const getOrdemServicoByItemTrabalho = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/ordens-servico/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar OrdemServico por item', error);
        throw error;
    }
};

export const getAllOrdensServico = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/ordens-servico?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de OrdemServico', error);
        throw error;
    }
};

export const deleteOrdemServico = async (id) => {
    try {
        const response = await api.delete(`/ordens-servico/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao excluir OrdemServico', error);
        throw error;
    }
};

export const createEmptyOrdemServico = async () => {
    try {
        const response = await api.post(`/ordens-servico`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar OrdemServico vazia', error);
        throw error;
    }
};

export const getOrdemServicoById = async (id) => {
    try {
        const response = await api.get(`/ordens-servico/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar OrdemServico por id', error);
        throw error;
    }
};

export const updateOrdemServicoById = async (id, data, itemTrabalhoId) => {
    try {
        const url = itemTrabalhoId ? `/ordens-servico/${id}?itemTrabalhoId=${itemTrabalhoId}` : `/ordens-servico/${id}`;
        const response = await api.patch(url, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar OrdemServico por id', error);
        throw error;
    }
};
