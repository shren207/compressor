import { useCallback, useEffect, useRef, useState } from 'react';
import { ExoQuant } from '~/utils/exoquant.js';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';

export interface FileInfo {
  id: string;
  name: string;
  size: number;
}

function App() {
  const filesRef = useRef<{ [key: string]: File }>({});
  const requestFilesRef = useRef<{ [key: string]: boolean }>({});
  const compressedFilesRef = useRef<{ [key: string]: Blob }>({});

  const [files, setFiles] = useState<{ [key: string]: FileInfo }>({});
  const [progresses, setProgresses] = useState<{ [key: string]: number }>({});
  const [compressedSizes, setCompressedSizes] = useState<{
    [key: string]: number;
  }>({});

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const hasFiles = useMemo(() => {
    return Object.keys(files).length > 0;
  }, [files]);

  const isReadyToDownload = useMemo(() => {
    return Object.keys(files).every((it) => compressedSizes[it] !== undefined || errors[it] !== undefined);
  }, [files, errors, compressedSizes]);

  const [exq, setExq] = useState<ExoQuant | null>(null);
  const [imageSrc, setImageSrc] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageData = await readFileAsImageData(file);
      compressImage(imageData);
    }
  };

  const onDrop = useCallback((files: Array<File>) => {
    const newFiles: { [key: string]: FileInfo } = {};

    for (let i = 0; i < files.length; i++) {
      const id = uuidv4();
      const it = files[i];

      filesRef.current[id] = it;
      newFiles[id] = {
        id,
        name: it.name,
        size: it.size,
      };
    }

    setFiles((prevState) => {
      return {
        ...prevState,
        ...newFiles,
      };
    });
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
    noClick: hasFiles,
  });

  const readFileAsImageData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          resolve(imageData);
        };
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const compressImage = (imageData) => {
    const exq = new ExoQuant();
    // Assuming imageData.data is a Uint8ClampedArray of the image's RGBA values
    exq.Feed(imageData.data);
    exq.QuantizeHq(256); // Quantize to 256 colors
    const palette = exq.GetPalette(256);
    const indexData = exq.MapImage(imageData.width * imageData.height, imageData.data);

    // Convert indexData and palette back to image displayable format if necessary
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="image/png, image/jpeg" />
      <img src={imageSrc} alt="Compressed" />
    </div>
  );
}

export default App;
