import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ExoQuant } from '~/utils/exoquant.js';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import produce from 'immer';
import styles from './App.module.scss';

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

  useEffect(() => {
    const keys = Object.keys(files);

    const uploadFiles = keys
      .filter((it) => !requestFilesRef.current[it])
      .map((it) => {
        const info = files[it];

        return {
          id: info.id,
          data: filesRef.current[info.id],
        };
      });
    console.log(uploadFiles);

    for (let i = 0; i < uploadFiles.length; i++) {
      const { id, data } = uploadFiles[i];

      const formData = new FormData();
      formData.append('image', data);
      requestFilesRef.current[id] = true;

      // axios
      //   .post<Blob>('http://localhost:3000/compress', formData, {
      //     responseType: 'blob',
      //     onUploadProgress: (progressEvent) => {
      //       setProgresses((prevState) => {
      //         return produce(prevState, (draft) => {
      //           draft[id] = progressEvent.progress || 0;
      //         });
      //       });
      //     },
      //   })
      //   .then((payload) => {
      //     if (payload.status === 200) {
      //       compressedFilesRef.current[id] = payload.data;
      //       setCompressedSizes((prevState) => {
      //         return produce(prevState, (draft) => {
      //           draft[id] = payload.data.size;
      //         });
      //       });
      //     }
      //   })
      //   .catch((error) => {
      //     setErrors((prevState) => {
      //       return produce(prevState, (draft) => {
      //         draft[id] = error.message || 'Unknown Error';
      //       });
      //     });
      //   });
    }
  }, [files]);

  return (
    <div className={styles.app}>
      <div {...getRootProps({ className: styles.inner })}>
        <input {...getInputProps()} />
      </div>
    </div>
  );
}

export default App;
