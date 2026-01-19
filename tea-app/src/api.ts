import axios from 'axios';
import { z } from 'zod';

import { TeaSchema, CreateTeaSchema } from './types';
import type { Tea, CreateTea } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const getTeas = async (): Promise<Tea[]> => {
  const response = await axios.get(`${API_URL}/teas`);
  return z.array(TeaSchema).parse(response.data);
};

export const createTea = async (tea: CreateTea): Promise<Tea> => {
  const response = await axios.post(`${API_URL}/teas`, tea);
  return TeaSchema.parse(response.data);
};

export const importTeaFromUrl = async (url: string): Promise<CreateTea> => {
  const response = await axios.post(`${API_URL}/teas/import`, { url });
  return CreateTeaSchema.parse(response.data);
};

export const deleteTea = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/teas/${id}`);
};
