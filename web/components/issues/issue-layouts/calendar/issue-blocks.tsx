import { Draggable } from "@hello-pangea/dnd";
import { Placement } from "@popperjs/core";
import { observer } from "mobx-react-lite";
import { TIssue, TIssueMap, TPaginationData } from "@plane/types";
// components
import { CalendarQuickAddIssueForm, CalendarIssueBlockRoot } from "@/components/issues";
// helpers
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
// types

type Props = {
  date: Date;
  issues: TIssueMap | undefined;
  issueIdList: string[];
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement, placement?: Placement) => React.ReactNode;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  isDragDisabled?: boolean;
  enableQuickIssueCreate?: boolean;
  disableIssueCreation?: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  readOnly?: boolean;
  isMobileView?: boolean;
};

export const CalendarIssueBlocks: React.FC<Props> = observer((props) => {
  const {
    date,
    issues,
    issueIdList,
    quickActions,
    loadMoreIssues,
    isDragDisabled = false,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    addIssuesToView,
    readOnly,
    isMobileView = false,
  } = props;
  // states
  const formattedDatePayload = renderFormattedPayloadDate(date);

  const {
    issues: { getGroupIssueCount, getPaginationData, getIssueLoader },
  } = useIssuesStore();

  if (!formattedDatePayload) return null;

  const dayIssueCount = getGroupIssueCount(formattedDatePayload, undefined, false);
  const nextPageResults = getPaginationData(formattedDatePayload, undefined)?.nextPageResults;
  const isPaginating = !!getIssueLoader(formattedDatePayload);

  const shouldLoadMore =
    nextPageResults === undefined && dayIssueCount !== undefined
      ? issueIdList?.length < dayIssueCount
      : !!nextPageResults;

  return (
    <>
      {issueIdList?.map((issueId, index) =>
        !isMobileView ? (
          <Draggable key={issueId} draggableId={issueId} index={index} isDragDisabled={isDragDisabled}>
            {(provided, snapshot) => (
              <div
                className="relative cursor-pointer p-1 px-2"
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                ref={provided.innerRef}
              >
                <CalendarIssueBlockRoot
                  issues={issues}
                  issueId={issueId}
                  quickActions={quickActions}
                  isDragging={snapshot.isDragging}
                />
              </div>
            )}
          </Draggable>
        ) : (
          <CalendarIssueBlockRoot key={issueId} issues={issues} issueId={issueId} quickActions={quickActions} />
        )
      )}

      {isPaginating && (
        <div className="p-1 px-2">
          <div className="flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded md:px-1 px-4 py-1.5 bg-custom-background-80 animate-pulse" />
        </div>
      )}

      {enableQuickIssueCreate && !disableIssueCreation && !readOnly && (
        <div className="px-1 md:px-2 py-1 border-custom-border-200 border-b md:border-none md:hidden group-hover:block">
          <CalendarQuickAddIssueForm
            formKey="target_date"
            groupId={formattedDatePayload}
            prePopulatedData={{
              target_date: formattedDatePayload,
            }}
            quickAddCallback={quickAddCallback}
            addIssuesToView={addIssuesToView}
          />
        </div>
      )}

      {shouldLoadMore && !isPaginating && (
        <div className="flex items-center px-2.5 py-1">
          <button
            type="button"
            className="w-min whitespace-nowrap rounded text-xs px-1.5 py-1 text-custom-text-400 font-medium  hover:bg-custom-background-80 hover:text-custom-text-300"
            onClick={() => loadMoreIssues(formattedDatePayload)}
          >
            Load More
          </button>
        </div>
      )}
    </>
  );
});
