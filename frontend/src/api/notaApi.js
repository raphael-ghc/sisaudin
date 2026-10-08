import api from './axiosInstance';

export const getNotaByItemTrabalho = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/notas/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar Nota por item', error);
        throw error;
    }
};

export const getAllNotas = async (page = 0, size = 10000) => {
    try {
        const response = await api.get(`/notas?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar lista de Nota', error);
        throw error;
    }
};

export const deleteNota = async (id) => {
    try {
        const response = await api.delete(`/notas/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao excluir Nota', error);
        throw error;
    }
};

export const createEmptyNota = async () => {
    try {
        const response = await api.post(`/notas`);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar Nota vazia', error);
        throw error;
    }
};

export const getNotaById = async (id) => {
    try {
        const response = await api.get(`/notas/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar Nota por id', error);
        throw error;
    }
};

export const updateNotaById = async (id, notaData, itemTrabalhoId = null) => {
    try {
        const params = itemTrabalhoId ? `?itemTrabalhoId=${itemTrabalhoId}` : '';
        const response = await api.patch(`/notas/${id}${params}`, notaData);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar Nota por id', error);
        throw error;
    }
};
