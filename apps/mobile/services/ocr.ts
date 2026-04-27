import { apiClient } from './api';

export async function recognizeTextFromImage(imageUri: string): Promise<string> {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'receipt.jpg';
  formData.append('image', {
    uri: imageUri,
    name: filename,
    type: 'image/jpeg',
  } as any);

  const response = await apiClient.post<{ text: string }>('/receipt/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.text;
}
