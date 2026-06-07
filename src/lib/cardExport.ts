import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { updateCard } from "./firebaseServices";

// Minimal interface matching Konva.Stage.toBlob — avoids importing Konva at module level
interface ExportableStage {
  toBlob(options: { pixelRatio: number }): Promise<Blob>;
}

export async function exportCardPNG(
  stage: ExportableStage,
  cardId: string
): Promise<string> {
  const blob = await stage.toBlob({ pixelRatio: 3 });
  const storageRef = ref(storage, `cards/${cardId}/output.png`);
  await uploadBytes(storageRef, blob, { contentType: "image/png" });
  const url = await getDownloadURL(storageRef);
  await updateCard(cardId, { imageUrl: url, aiStatus: "done" });
  return url;
}
