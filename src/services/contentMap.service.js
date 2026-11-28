import api from "./api";

const ContentMapService = {
  // Posts para linkar no texto (R-MAP-06): { suggestions: [{ id, title, slug, url, sharedTags, publishedAt }] }
  // Manda as tags e o texto que estão no editor, salvos ou não.
  async getLinkSuggestions({ postId, tags, content }) {
    const { data } = await api.post("/content-map/suggestions", { ...(postId ? { postId } : {}), tags, content });
    return data.suggestions || [];
  },
};

export default ContentMapService;
