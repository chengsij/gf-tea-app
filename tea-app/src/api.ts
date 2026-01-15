import axios from 'axios';
import type { Tea } from './types';

const API_URL = 'http://localhost:3001/api';

export const getTeas = async (): Promise<Tea[]> => {
  const response = await axios.get(`${API_URL}/teas`);
  return response.data;
};

export const createTea = async (tea: Omit<Tea, 'id'>): Promise<Tea> => {
  const response = await axios.post(`${API_URL}/teas`, tea);
  return response.data;
};

export const importTeaFromUrl = async (url: string): Promise<Omit<Tea, 'id'>> => {
  const response = await axios.post(`${API_URL}/teas/import`, { url });
  return response.data;
};

export const deleteTea = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/teas/${id}`);
};
