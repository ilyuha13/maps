import { z } from "zod";

export const zEnv = z.object({
  VITE_DADATA_API_KEY: z.string().min(1, "Dadata API key is required"),
  VITE_DADATA_URL: z.string().min(1, "Dadata URL is required"),
});

export const env = zEnv.parse(import.meta.env);
