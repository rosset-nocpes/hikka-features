import parse, {
  domToReact,
  type HTMLReactParserOptions,
} from 'html-react-parser';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useNovelReader } from './context/novel-reader-context';

const NovelRenderer = ({ htmlContent }: { htmlContent: string }) => {
  const { container } = useNovelReader();

  const options: HTMLReactParserOptions = {
    replace: (domNode: any) => {
      if (domNode.attribs && domNode.attribs.class === 'hover-card-trigger') {
        const term = domNode.attribs['data-term'];
        const definition = domNode.attribs['data-definition'];

        return (
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <span className="cursor-help text-primary underline decoration-dotted underline-offset-4">
                {domToReact(domNode.children)}
              </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" container={container}>
              <div className="flex flex-col gap-2">
                <h4 className="font-semibold text-sm">{term}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {definition}
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      }
    },
  };

  return (
    <div className="[&_img]:rounded-md [&_img]:border [&_p:not(:first-child)]:mt-6 [&_p]:leading-7 [&_span]:inline">
      {parse(htmlContent, options)}
    </div>
  );
};

export default NovelRenderer;
