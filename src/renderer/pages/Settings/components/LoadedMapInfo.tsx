import React from 'react';

interface LoadedMapInfoProps {
    loadedMapInfo: string | null;
    setConfirmResetMapOpen: (open: boolean) => void;
}

const LoadedMapInfo: React.FC<LoadedMapInfoProps> = ({ loadedMapInfo, setConfirmResetMapOpen }) => {
    if (!loadedMapInfo) {
        return <p>No map loaded</p>;
    }

    try {
        const map = JSON.parse(loadedMapInfo);
        const songName = map.metadata.songName || 'Unknown Song';
        const songSubName = map.metadata.songSubName;
        const songAuthor = map.metadata.songAuthorName || 'Unknown Author';
        const mapper = map.metadata.levelAuthorName || 'Unknown Mapper';
        const bpm = map.metadata.bpm || 'Unknown BPM';
        const duration = map.metadata.duration || 'Unknown Duration';

        const formattedDuration = new Date(duration * 1000).toISOString().substr(14, 5);

        let coverURL = '';
        if (map.versions && map.versions.length > 0 && map.versions[0].coverURL) {
            coverURL = map.versions[0].coverURL;
        }

        return (
            <div className="relative p-3 rounded-2xl overflow-hidden text-white">
                {coverURL && (
                    <>
                        <div
                            className="absolute top-0 bottom-0 left-0 right-0 bg-cover bg-center filter blur-lg z-[-2]"
                            style={{ backgroundImage: `url(${coverURL})` }}
                        />
                        <div className="absolute top-0 bottom-0 left-0 right-0 bg-black/30 z-[-1]" />
                    </>
                )}
                <div className="flex flex-col">
                    <div className="flex justify-between space-x-2 items-start">
                        <div className="flex flex-col space-1">
                          <h3 className="text-md">{songAuthor}</h3>
                          <h3 className="text-lg font-semibold">{songName} { songSubName && <span className="text-sm font-normal truncate">{songSubName}</span> }</h3>

                        </div>
                        <div className="flex flex-col items-end">
                            <h4 className="text-right text-sm font-semibold">BPM: {bpm}</h4>
                            <h4 className="text-right text-sm font-semibold">Duration: {formattedDuration}</h4>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <p className="m-0">Mapped by <span className='font-semibold'>{mapper}</span></p>
                    </div>
                    <button
                        className="absolute bottom-0 right-0 bg-red-500 text-white px-2 py-1 rounded-tl-xl hover:bg-red-600 transition duration-200"
                        onClick={() => {
                            setConfirmResetMapOpen(true);
                        }}
                    >
                        Reset Loaded Map
                    </button>
                </div>
            </div>
        );
    } catch (error) {
        return <p>{loadedMapInfo}</p>;
    }
};

export default LoadedMapInfo;
