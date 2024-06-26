import { observer } from "mobx-react-lite";
// components
import { IssueListBlock } from "@/components/issues/board-views/list/block";
import { IssueListHeader } from "@/components/issues/board-views/list/header";
// interfaces
// mobx hook
import { useMobxStore } from "@/hooks/store";
// store
import { RootStore } from "@/store/root.store";
import { IIssueState, IIssue } from "types/issue";

export const IssueListView = observer(() => {
  const { issue: issueStore }: RootStore = useMobxStore();

  return (
    <>
      {issueStore?.states &&
        issueStore?.states.length > 0 &&
        issueStore?.states.map((_state: IIssueState) => (
          <div key={_state.id} className="relative w-full">
            <IssueListHeader state={_state} />
            {issueStore.getFilteredIssuesByState(_state.id) &&
            issueStore.getFilteredIssuesByState(_state.id).length > 0 ? (
              <div className="divide-y divide-custom-border-200">
                {issueStore.getFilteredIssuesByState(_state.id).map((_issue: IIssue) => (
                  <IssueListBlock key={_issue.id} issue={_issue} />
                ))}
              </div>
            ) : (
              <div className="bg-custom-background-100 p-3 text-sm text-custom-text-400">No issues.</div>
            )}
          </div>
        ))}
    </>
  );
});
