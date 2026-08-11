import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const SecurePdfViewer = ({ pdfUrl, onClose, inline = false }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [isBlackedOut, setIsBlackedOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // ── SECURITY MEASURES ──
    
    // 1. Prevent Print Screen & Other Shortcuts
    const handleKeyDown = (e) => {
      // PrintScreen key is usually 'PrintScreen', keyCode 44
      // Windows/Meta key is 'Meta'
      if (
        e.key === 'PrintScreen' || 
        e.key === 'Meta' || 
        e.key === 'Alt' || 
        e.ctrlKey || 
        e.shiftKey
      ) {
        e.preventDefault();
        setIsBlackedOut(true);
        setTimeout(() => setIsBlackedOut(false), 3000); // Blackout for 3 seconds
      }
    };

    // 2. Blackout on Window Blur (when user switches apps or opens snipping tool)
    const handleBlur = () => setIsBlackedOut(true);
    const handleFocus = () => setIsBlackedOut(false);

    // 3. Blackout on Print
    const handleBeforePrint = () => setIsBlackedOut(true);
    const handleAfterPrint = () => setIsBlackedOut(false);

    // Prevent Copy/Cut
    const handleCopyCut = (e) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    if (!inline) {
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
    }
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    window.addEventListener('copy', handleCopyCut);
    window.addEventListener('cut', handleCopyCut);

    // Load PDF.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.min.js';
    
    script.onload = () => {
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';
      
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      loadingTask.promise.then((pdf) => {
        setNumPages(pdf.numPages);
        setPdfDoc(pdf);
        setLoading(false);
      }).catch(err => {
        console.error('Error loading PDF:', err);
        setErrorMsg(err.message || 'Error loading PDF');
        setLoading(false);
      });
    };
    
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      window.removeEventListener('keydown', handleKeyDown);
      if (!inline) {
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
      }
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      window.removeEventListener('copy', handleCopyCut);
      window.removeEventListener('cut', handleCopyCut);
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (pdfDoc && currentPage > 0) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, inline]);

  const renderPage = async (pageNum) => {
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(pageNum);
      
      if (containerRef.current) {
        containerRef.current.innerHTML = ''; // Clear previous canvas
      }
      
      const containerWidth = containerRef.current ? containerRef.current.clientWidth - 40 : 800;
      const viewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale: scale > 2 ? 2 : scale }); // max scale 2

      const canvas = document.createElement('canvas');
      canvas.style.display = 'block';
      canvas.style.margin = '0 auto';
      canvas.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      canvas.style.borderRadius = '8px';
      
      const context = canvas.getContext('2d');
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };
      
      await page.render(renderContext).promise;
      
      if (containerRef.current) {
        containerRef.current.appendChild(canvas);
      }
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) setCurrentPage(currentPage + 1);
  };
  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div style={inline ? {
      width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%'
    } : {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      {/* Header */}
      {!inline && (
        <div style={{
          padding: '15px 20px', background: '#1e293b', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #334155'
        }}>
          <h3 style={{ color: 'white', margin: 0 }}>Question Paper (Secure View)</h3>
          <button 
            onClick={onClose}
            style={{
              background: '#ef4444', color: 'white', border: 'none', 
              borderRadius: '50%', width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && numPages > 0 && (
        <div style={{
          padding: '10px 20px', 
          background: inline ? '#f8fafc' : '#334155', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <button 
            onClick={goToPrevPage} 
            disabled={currentPage <= 1}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '8px 16px', background: currentPage <= 1 ? '#cbd5e1' : '#3b82f6',
              color: 'white', border: 'none', borderRadius: '6px',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={16} /> Previous Page
          </button>
          
          <span style={{ fontWeight: 'bold', color: inline ? '#1e293b' : 'white' }}>
            Page {currentPage} of {numPages}
          </span>
          
          <button 
            onClick={goToNextPage} 
            disabled={currentPage >= numPages}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '8px 16px', background: currentPage >= numPages ? '#cbd5e1' : '#3b82f6',
              color: 'white', border: 'none', borderRadius: '6px',
              cursor: currentPage >= numPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next Page <ChevronRight size={16} />
          </button>
        </div>
      )}
      
      {/* Viewer Area (Protected from right click & selection) */}
      <div 
        ref={containerRef}
        onContextMenu={(e) => e.preventDefault()}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: inline ? '20px 0' : '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          userSelect: 'none', WebkitUserSelect: 'none' // Disable text selection
        }}
      >
        {loading && (
          <div style={{ color: inline ? '#1e293b' : 'white', textAlign: 'center', marginTop: '50px', fontSize: '1.2rem' }}>
            Loading PDF securely...
          </div>
        )}
        
        {errorMsg && (
          <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '50px', fontSize: '1.2rem' }}>
            Failed to load PDF: {errorMsg}
          </div>
        )}
      </div>

      {/* Blackout Overlay */}
      {isBlackedOut && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'black', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'red', fontSize: '1.5rem', fontWeight: 'bold'
        }}>
          SCREENSHOT / RECORDING / PRINTING DISABLED
        </div>
      )}
    </div>
  );
};

export default SecurePdfViewer;
