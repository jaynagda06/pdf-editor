import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type Toast = { id: number; message: string };

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastId = useRef(0);

  const showToast = useCallback((message: string) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (selectedFile.type !== 'application/pdf') {
        showToast('Please select a PDF file.');
        return;
      }
      setFile(selectedFile);
      setIsLoading(true);
      setPageCount(null);

      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPageCount(pdf.numPages);

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvas, viewport }).promise;
      } catch (err) {
        console.error(err);
        showToast('Failed to load PDF. Please try another file.');
        setFile(null);
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleClickChoose = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
    e.target.value = '';
  };

  const handleStartOver = () => {
    setFile(null);
    setPageCount(null);
    setIsLoading(false);
    setIsDragOver(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <h1 className="text-xl font-semibold text-gray-900">PDF Editor</h1>
          </div>
          <a
            href="#"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.section
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="max-w-2xl w-full text-center"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-4xl md:text-5xl font-medium text-gray-900 leading-tight mb-6"
              >
                Edit PDFs for free, right in your browser
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                className="text-lg md:text-xl text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed"
              >
                No sign up. No uploads to any server. Everything happens on your device.
              </motion.p>
              <motion.button
                onClick={handleClickChoose}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                className="group w-full sm:w-auto px-10 py-4 rounded-xl bg-accent text-white text-lg font-medium
                  hover:bg-accent-hover transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                  shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Choose PDF
              </motion.button>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                className="mt-10 relative"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <p className="text-sm text-gray-500 mb-4">or drag and drop</p>
                <motion.div
                  animate={{ scale: isDragOver ? 1.02 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="relative border-2 border-dashed rounded-2xl p-12 text-center
                    transition-colors duration-200
                    bg-gray-50
                    border-gray-300
                    hover:border-accent hover:bg-accent/5
                    group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Choose PDF file"
                  />
                  <svg
                    className="mx-auto w-12 h-12 text-gray-400 group-hover:text-accent transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mt-4 text-gray-600">Drop a PDF file here</p>
                  <p className="mt-1 text-sm text-gray-500">(.pdf only, max 50MB)</p>
                </motion.div>
              </motion.div>
            </motion.section>
          ) : (
            <motion.section
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="max-w-4xl w-full"
            >
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                  <div className="flex items-center justify-center min-h-[500px]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full"
                      aria-label="Loading PDF"
                    />
                  </div>
                ) : (
                  <div className="relative bg-gray-100 min-h-[500px] flex items-center justify-center p-4">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full max-h-[70vh] shadow-lg bg-white"
                    />
                  </div>
                )}
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-[300px]">{file.name}</p>
                      <p className="text-sm text-gray-500">{pageCount} page{pageCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <motion.a
                    onClick={handleStartOver}
                    className="text-sm text-accent hover:text-accent-hover font-medium transition-colors whitespace-nowrap"
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start over
                  </motion.a>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-gray-200 px-6 py-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-500">
            100% private — your files never leave your computer
          </p>
        </div>
      </footer>

      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg max-w-sm"
            role="alert"
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default App;