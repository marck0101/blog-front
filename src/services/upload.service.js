import api from "./api";

const UploadService = {
  async uploadCover(file) {
    const formData = new FormData();
    formData.append("cover", file);
    const { data } = await api.post("/upload/cover", formData);
    return data.url;
  },
};

export default UploadService;
