import axios from "axios";
import { Result } from "@/interfaces/result";
import { toApiError } from "../request";

// Uploads straight to S3, not to our backend: bare axios (no base URL, no cookies) and no response envelope.
export async function uploadToPresignedUrl(url: string, file: File, contentType: string, onProgress: (progress: number) => void): Promise<Result<void>> {
    try {
        await axios.put(url, file, {
            headers: {
                "Content-Type": contentType
            },
            onUploadProgress: (e) => onProgress(e.loaded / (e.total ?? file.size))
        });
        return { ok: true, data: undefined };
    } catch (error) {
        console.error("Upload error", error);
        return { ok: false, error: toApiError(error) };
    }
}
