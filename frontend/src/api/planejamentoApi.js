import api from './axiosInstance';

export const getPlanejamentoByItemTrabalho = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/planejamentos/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar Planejamento por item', error);
        throw error;
    }
};

export const getAllPlanejamentos = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/planejamentos?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de Planejamentos', error);
        throw error;
    }
};

export const getPlanejamentoById = async (id) => {
    try {
        const response = await api.get(`/planejamentos/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar Planejamento por id', error);
        throw error;
    }
};

export const createPlanejamento = async (data) => {
    try {
        const response = await api.post(`/planejamentos`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar Planejamento', error);
        throw error;
    }
};

export const createEmptyPlanejamento = async () => {
    try {
        const response = await api.post(`/planejamentos`, { status: "Minuta" });
        return response.data;
    } catch (error) {
        console.error('Erro ao criar Planejamento vazio', error);
        throw error;
    }
};

export const updatePlanejamento = async (id, data) => {
    try {
        const response = await api.put(`/planejamentos/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar Planejamento', error);
        throw error;
    }
};

export const deletePlanejamento = async (id) => {
    try {
        const response = await api.delete(`/planejamentos/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao excluir Planejamento', error);
        throw error;
    }
};
