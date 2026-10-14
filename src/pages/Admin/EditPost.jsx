import { useParams } from "react-router-dom";
import PostEditor from "../../components/PostEditor";

export default function EditPost() {
  const { id } = useParams();
  // key: trocar de post (ou sair do "novo" para o salvo) recomeça o editor do zero
  return <PostEditor key={id} postId={id} />;
}
