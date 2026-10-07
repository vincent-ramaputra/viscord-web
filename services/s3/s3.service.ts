import { Response } from "@/interfaces/response";
import axios, { AxiosError, HttpStatusCode } from "axios";

export async function uploadToPresignedUrl(url: string, file: File, contentType: string, onProgress: (progress: number) => void) : Promise<Response<null>> {
     try {
        const response = await axios.put(url, file, {
            headers: {
                "Content-Type": contentType
            },
            onUploadProgress: (e) => onProgress(e.loaded / (e.total ?? file.size))
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success({
                data: null,
                message: response.data.message
            });
        }
        return Response.Failed({
            message: response.data.message
        });
    } catch (error) {
        console.error("Upload error", error);
        if (error instanceof AxiosError)
            return Response.Failed({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed({
        message: "An unknown error occurred."
    });   
}