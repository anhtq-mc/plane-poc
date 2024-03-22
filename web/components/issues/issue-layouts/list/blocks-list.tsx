import { FC, MutableRefObject } from "react";
// components
import RenderIfVisible from "components/core/render-if-visible-HOC";
import { IssueBlock } from "components/issues";
// types
import { TGroupedIssues, TIssue, IIssueDisplayProperties, TIssueMap } from "@plane/types";
import { observer } from "mobx-react";

interface Props {
  issueIds: TGroupedIssues | any;
  issuesMap: TIssueMap;
  canEditProperties: (projectId: string | undefined) => boolean;
  updateIssue:
    | ((projectId: string | null | undefined, issueId: string, data: Partial<TIssue>) => Promise<void>)
    | undefined;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  containerRef: MutableRefObject<HTMLDivElement | null>;
}

export const IssueBlocksList: FC<Props> = observer((props) => {
  const { issueIds, issuesMap, updateIssue, quickActions, displayProperties, canEditProperties, containerRef } = props;

  return (
    <div className="relative h-full w-full">
      {issueIds && issueIds.length > 0 ? (
        issueIds.map((issueId: string) => {
          if (!issueId) return null;
          return (
            <RenderIfVisible
              key={`${issueId}`}
              defaultHeight="3rem"
              root={containerRef}
              classNames={"relative border border-transparent border-b-custom-border-200"}
              changingReference={issueIds}
            >
              <IssueBlock
                issueId={issueId}
                issuesMap={issuesMap}
                updateIssue={updateIssue}
                quickActions={quickActions}
                canEditProperties={canEditProperties}
                displayProperties={displayProperties}
              />
            </RenderIfVisible>
          );
        })
      ) : (
        <div className="bg-custom-background-100 p-3 text-sm text-custom-text-400">No issues</div>
      )}
    </div>
  );
});
