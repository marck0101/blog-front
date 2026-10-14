import { useSearchParams } from "react-router-dom";
import PostEditor from "../../components/PostEditor";

// Vindo do calendário (?plannedAt=AAAA-MM-DD): rascunho já com a data
export default function CreatePost() {
  const [searchParams] = useSearchParams();
  return <PostEditor initialPlannedAt={searchParams.get("plannedAt") || ""} />;
}
