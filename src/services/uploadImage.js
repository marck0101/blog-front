// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// // import { storage } from "../../firebase"; // ajuste se seu firebase estiver em outro caminho
// import { storage } from "../../firebase"

// const storage = getStorage(app);

// export async function uploadImage(file) {
//   if (!file) throw new Error("Arquivo inválido");

//   const fileName = `${Date.now()}-${file.name}`;
//   const imageRef = ref(storage, `blog/${fileName}`);

//   await uploadBytes(imageRef, file);
//   const url = await getDownloadURL(imageRef);

//   return url;
// }

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../firebase'

const MAX_SIZE_MB = 5

export async function uploadImage(file) {
  if (!file) return null

  if (!file.type.startsWith('image/')) {
    throw new Error('Arquivo não é uma imagem')
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Imagem maior que ${MAX_SIZE_MB}MB`)
  }

  const safeName = file.name.replace(/\s+/g, '-').toLowerCase()
  const fileRef = ref(
    storage,
    `blog/${Date.now()}-${safeName}`
  )

  const snapshot = await uploadBytes(fileRef, file)
  return await getDownloadURL(snapshot.ref)
}
