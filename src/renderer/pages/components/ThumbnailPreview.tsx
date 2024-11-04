import ReactDOM from 'react-dom';
import React from 'react';

interface ThumbnailPreviewProps {
  imageSrc: string | null;
  setThumbnailPreviewModal: (show: boolean) => void;
}


const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  imageSrc,
  setThumbnailPreviewModal
}) => {

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setThumbnailPreviewModal(false);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="modal-overlay fixed inset-0 bg-black/10 backdrop-blur-lg flex justify-center items-center z-50 rounded-3xl animate-fade animate-duration-200"
      onClick={handleClickOutside}
    >
      <div className="relative modal-content bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 p-2 rounded-2xl animate-jump-in animate-duration-300">
        {imageSrc &&
        <img src={imageSrc} alt='Card Preview' className='w-[80vw]'/>
        }
      </div>
    </div>,
    document.body
  );
};

export default ThumbnailPreview;
