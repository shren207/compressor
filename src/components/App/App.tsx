import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { ExoQuant } from '~/utils/exoquant.js';
import styles from './App.module.scss';

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  blobUrl?: string; // Blob URL을 저장할 속성
}

function App() {
  const filesRef = useRef<{ [key: string]: File }>({});
  const [files, setFiles] = useState<{ [key: string]: FileInfo }>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const id = uuidv4();
      filesRef.current[id] = file;
      setFiles(prev => ({
        ...prev,
        [id]: { id, name: file.name, size: file.size }
      }));

      readFileAndQuantize(file, id);
    });
  }, []);

  const readFileAndQuantize = (file: File, fileId: string) => {
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        await quantizeImage(imageData, fileId);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  };

  const quantizeImage = async (imageData: ImageData, fileId: string) => {
    const exq = new ExoQuant();
    exq.Feed(imageData.data);
    exq.Quantize(70 / 100 * 256);

    const palette = exq.GetPalette(70 / 100 * 256);
    const newImageData = exq.MapImageOrdered(imageData.width, imageData.height, imageData.data);

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = imageData.width;
    outputCanvas.height = imageData.height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) return;

    const outputImage = new ImageData(new Uint8ClampedArray(imageData.width * imageData.height * 4), imageData.width, imageData.height);
    for (let i = 0; i < newImageData.length; i++) {
      const index = newImageData[i] * 4;
      outputImage.data[i * 4 + 0] = palette[index + 0];
      outputImage.data[i * 4 + 1] = palette[index + 1];
      outputImage.data[i * 4 + 2] = palette[index + 2];
      outputImage.data[i * 4 + 3] = 255;
    }
    outputCtx.putImageData(outputImage, 0, 0);

    outputCanvas.toBlob((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      setFiles(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          blobUrl: blobUrl
        }
      }));
    }, 'image/png');
  };

  const downloadImage = (fileId: string) => {
    const file = files[fileId];
    const link = document.createElement('a');
    link.href = file.blobUrl!;
    link.download = `compressed-${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
  });

  return (
    <div className={styles.app}>
      <div {...getRootProps({ className: styles.inner })}>
        <input {...getInputProps()} />
      </div>
      <div>
        {Object.values(files).map(file => (
          <div key={file.id}>
            <p>{file.name} - {file.size} bytes</p>
            {file.blobUrl && (
              <button onClick={() => downloadImage(file.id)}>Download</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
