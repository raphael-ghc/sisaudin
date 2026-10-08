import api from './axiosInstance';

export const getStatusDocumento = async (tipo, id) => {
    try {
        const url = tipo === 'item-trabalho' ? `/item-trabalho/${id}/historico-status` : `/documentos-status/${tipo}/${id}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar status do documento:', error);
        throw error;
    }
};

export const transitarStatusDocumento = async (tipo, id, payload) => {
    try {
        const url = tipo === 'item-trabalho' ? `/item-trabalho/${id}/transitar` : `/documentos-status/${tipo}/${id}/transitar`;
        const response = await api.post(url, payload);
        return response.data;
    } catch (error) {
        console.error('Erro ao transitar status do documento:', error);
        throw error;
    }
};

export const updateRevisaoItem = async (tipo, id, itemId, payload) => {
    try {
        const response = await api.put(`/documentos-status/${tipo}/${id}/checklist/revisao/${itemId}`, payload);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar item de revisão:', error);
        throw error;
    }
};

export const updateAprovacaoItem = async (tipo, id, itemId, payload) => {
    try {
        const response = await api.put(`/documentos-status/${tipo}/${id}/checklist/aprovacao/${itemId}`, payload);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar item de aprovação:', error);
        throw error;
    }
};
