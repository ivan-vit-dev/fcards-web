import { toBlob } from "html-to-image";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { updateCard } from "./firebaseServices";

// Renders the on-screen card (CardPreview) at print resolution and stores it as the card image.
export async function exportCardPNG(node: HTMLElement, cardId: string): Promise<string> {
  const blob = await toBlob(node, { pixelRatio: 3, cacheBust: true });
  if (!blob) throw new Error("Card render produced no image");
  const storageRef = ref(storage, `cards/${cardId}/output.png`);
  await uploadBytes(storageRef, blob, { contentType: "image/png" });
  const url = await getDownloadURL(storageRef);
  await updateCard(cardId, { imageUrl: url });
  return url;
}
