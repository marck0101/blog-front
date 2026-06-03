import api from "./api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

export async function uploadImage(file) {
  if (!file) return null;

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato inválido. Use JPEG, PNG ou WEBP.");
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Imagem maior que ${MAX_SIZE_MB}MB`);
  }

  const formData = new FormData();
  formData.append("cover", file);

  const { data } = await api.post("/upload/cover", formData);
  return data.url;
}
