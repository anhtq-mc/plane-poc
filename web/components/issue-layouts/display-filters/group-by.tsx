import React from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// types
import { TIssueGroupByOptions } from "types";
// constants
import { ISSUE_GROUP_BY_OPTIONS } from "constants/issue";

export const FilterGroupBy = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleGroupBy = (value: TIssueGroupByOptions) => {
    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        group_by: value,
      },
    });
  };

  return (
    <>
      <FilterHeader
        title="Group by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_GROUP_BY_OPTIONS.map((groupBy) => (
            <FilterOption
              key={groupBy?.key}
              isChecked={issueFilterStore?.userDisplayFilters?.group_by === groupBy?.key ? true : false}
              onClick={() => handleGroupBy(groupBy.key)}
              title={groupBy.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});