import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from 'react';

interface ReaderContextType {
  state: ReaderState;
  setState: (state: ReaderState | ((prev: ReaderState) => ReaderState)) => void;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export const getRead = (): number => {
  const selector = 'div.rounded-lg.border:nth-child(2) h3';
  const element = document.querySelector(selector);
  return element?.firstChild?.nodeValue
    ? parseInt(element.firstChild.nodeValue, 10)
    : 0;
};

const getInitialReaderState = (
  data: API.ReadData,
  currentChapter: API.ChapterData,
): ReaderState => {
  return {
    mangaData: data,
    currentChapter,
    chapterImages: [],
    imagesLoading: true,
    sidebarMode: 'offcanvas', // todo: move to local storage
  };
};

interface ReaderProviderProps extends PropsWithChildren {
  data: API.ReadData;
  slug: string;
}

export const ReaderProvider: FC<ReaderProviderProps> = ({
  children,
  data,
  slug,
}) => {
  const currentChapter = data.chapters[0];

  const [readerState, setReaderState] = useState<ReaderState>(
    () => getInitialReaderState(data, currentChapter), // Updated call
  );

  // Call useReadChapterData at the top level
  const { data: chapterImagesData, isLoading } = useReadChapterData(
    slug,
    readerState.currentChapter?.chapter,
  );

  // useEffect to update state when chapterImagesData changes
  useEffect(() => {
    setReaderState((prevState) => ({
      ...prevState,
      chapterImages: chapterImagesData?.images || [],
      imagesLoading: isLoading,
    }));
  }, [chapterImagesData?.images, isLoading]);

  return (
    <ReaderContext.Provider
      value={{ state: readerState, setState: setReaderState }}
    >
      {children}
    </ReaderContext.Provider>
  );
};

export const useReaderContext = () => {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error('useReaderContext must be used within a ReaderProvider');
  }
  return context;
};
