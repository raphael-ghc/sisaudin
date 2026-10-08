import api from './axiosInstance';

export const getStatusFluxo = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/fluxo-documentos/item/${itemTrabalhoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar status do fluxo do item de trabalho:', error);
        throw error;
    }
};

export const getDocumentosCriados = async (itemTrabalhoId) => {
    try {
        const response = await api.get(`/fluxo-documentos/item/${itemTrabalhoId}/criados`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar documentos criados do item de trabalho:', error);
        throw error;
    }
};

