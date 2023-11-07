import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
import { Dialog, Transition } from "@headlessui/react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { IssueService } from "services/issue";
import { ModuleService } from "services/module.service";
// hooks
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
// components
import { DraftIssueForm } from "components/draft-issues";
// constants
import { ISSUE_PRIORITIES, ISSUE_STATE_GROUPS, getValueFromObject } from "constants/issue";
// types
import type { IIssue } from "types";
// fetch-keys
import { SUB_ISSUES } from "constants/fetch-keys";

interface IssuesModalProps {
  handleClose: () => void;
  isOpen: boolean;
  isUpdatingSingleIssue?: boolean;
  initialData?: Partial<IIssue>;
  fieldsToShow?: (
    | "project"
    | "name"
    | "description"
    | "state"
    | "priority"
    | "assignee"
    | "label"
    | "startDate"
    | "dueDate"
    | "estimate"
    | "parent"
    | "all"
  )[];
  onSubmit?: (data: Partial<IIssue>) => Promise<void> | void;
}

// services
const issueService = new IssueService();
const moduleService = new ModuleService();

export const CreateUpdateDraftIssueModal: React.FC<IssuesModalProps> = observer((props) => {
  const { handleClose, isOpen, initialData, fieldsToShow = ["all"], onSubmit } = props;

  // states
  const [createMore, setCreateMore] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [prePopulateData, setPreloadedData] = useState<Partial<IIssue> | undefined>(undefined);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const {
    project: projectStore,
    draftIssues: draftIssueStore,
    draftIssueFilters: draftIssueFilterStore,
    issueDetail: issueDetailStore,
    issue: issueStore,
    user: userStore,
  } = useMobxStore();

  const user = userStore.currentUser;
  const projects = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined;

  const { clearValue: clearDraftIssueLocalStorage } = useLocalStorage("draftedIssue", {});

  const { setToastAlert } = useToast();

  const onClose = () => {
    handleClose();
    setActiveProject(null);
  };

  const onDiscard = () => {
    clearDraftIssueLocalStorage();
    onClose();
  };

  useEffect(() => {
    setPreloadedData(initialData ?? {});

    if (cycleId && !initialData?.cycle) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...initialData,
        cycle: cycleId.toString(),
      }));
    }
    if (moduleId && !initialData?.module) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...initialData,
        module: moduleId.toString(),
      }));
    }
    if ((router.asPath.includes("my-issues") || router.asPath.includes("assigned")) && !initialData?.assignees) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...initialData,
        assignees: initialData?.assignees ?? [user?.id ?? ""],
      }));
    }
  }, [initialData, cycleId, moduleId, router.asPath, user?.id]);

  useEffect(() => {
    // if modal is closed, reset active project to null
    // and return to avoid activeProject being set to some other project
    if (!isOpen) {
      setActiveProject(null);
      return;
    }

    // if data is present, set active project to the project of the
    // issue. This has more priority than the project in the url.
    if (initialData && initialData.project) return setActiveProject(initialData.project);

    if (prePopulateData && prePopulateData.project && !activeProject) return setActiveProject(prePopulateData.project);

    if (prePopulateData && prePopulateData.project && !activeProject) return setActiveProject(prePopulateData.project);

    // if data is not present, set active project to the project
    // in the url. This has the least priority.
    if (projects && projects.length > 0 && !activeProject)
      setActiveProject(projects?.find((p) => p.id === projectId)?.id ?? projects?.[0].id ?? null);
  }, [activeProject, initialData, projectId, projects, isOpen, prePopulateData]);

  const createDraftIssue = async (payload: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject || !user) return;

    await draftIssueStore
      .createDraftIssue(workspaceSlug.toString(), activeProject, payload)
      .then(() => {
        draftIssueStore.fetchIssues(workspaceSlug.toString(), activeProject);

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be created. Please try again.",
        });
      });

    if (!createMore) onClose();
  };

  const updateDraftIssue = async (payload: Partial<IIssue>) => {
    if (!user || !workspaceSlug || !activeProject) return;

    await draftIssueStore
      .updateDraftIssue(workspaceSlug.toString(), activeProject, payload as IIssue)
      .then((response) => {
        if (!createMore) onClose();

        const userDisplayFilters = draftIssueFilterStore?.userDisplayFilters;
        const groupBy = userDisplayFilters?.group_by || null;

        let groupById: null | string = null;

        if (groupBy === "priority") {
          groupById = getValueFromObject(ISSUE_PRIORITIES, "key") as string;
        } else if (groupBy === "labels") {
          groupById = getValueFromObject(projectStore?.projectLabels ?? [], "id") as string;
        } else if (groupBy === "state_detail.group") {
          groupById = getValueFromObject(ISSUE_STATE_GROUPS, "key") as string;
        }

        draftIssueStore.updateIssueStructure(groupById, null, response);
        draftIssueStore.fetchIssues(workspaceSlug.toString(), activeProject);

        if (!payload.is_draft) {
          if (payload.cycle && payload.cycle !== "") addIssueToCycle(response.id, payload.cycle);
          if (payload.module && payload.module !== "") addIssueToModule(response.id, payload.module);
        }

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be updated. Please try again.",
        });
      });
  };

  const addIssueToCycle = async (issueId: string, cycleId: string) => {
    if (!workspaceSlug || !activeProject || !user) return;

    await issueService.addIssueToCycle(
      workspaceSlug as string,
      activeProject ?? "",
      cycleId,
      {
        issues: [issueId],
      },
      user
    );
  };

  const addIssueToModule = async (issueId: string, moduleId: string) => {
    if (!workspaceSlug || !activeProject || !user) return;

    await moduleService.addIssuesToModule(
      workspaceSlug as string,
      activeProject ?? "",
      moduleId as string,
      {
        issues: [issueId],
      },
      user
    );
  };

  const createIssue = async (payload: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject || !user) return;

    await issueDetailStore
      .createIssue(workspaceSlug.toString(), activeProject, payload)
      .then(async (res) => {
        issueStore.fetchIssues(workspaceSlug.toString(), activeProject);

        if (payload.cycle && payload.cycle !== "") await addIssueToCycle(res.id, payload.cycle);
        if (payload.module && payload.module !== "") await addIssueToModule(res.id, payload.module);

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });

        if (payload.parent && payload.parent !== "") mutate(SUB_ISSUES(payload.parent));
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be created. Please try again.",
        });
      });

    if (!createMore) onClose();
  };

  const convertDraftToIssue = async (payload: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject) return;
    await draftIssueStore.convertDraftIssueToIssue(workspaceSlug.toString(), activeProject, payload?.id!).then(() => {
      draftIssueStore.fetchIssues(workspaceSlug.toString(), activeProject);

      // adding to cycle or/and module if payload is available for the same
      if (payload.cycle && payload.cycle !== "") addIssueToCycle(payload?.id!, payload.cycle);
      if (payload.module && payload.module !== "") addIssueToModule(payload?.id!, payload.module);
    });
  };

  const handleFormSubmit = async (
    formData: Partial<IIssue>,
    action: "createDraft" | "createNewIssue" | "updateDraft" | "convertToNewIssue" = "createDraft"
  ) => {
    if (!workspaceSlug || !activeProject) return;

    const payload: Partial<IIssue> = {
      ...formData,
      description: formData.description ?? "",
      description_html: formData.description_html ?? "<p></p>",
    };

    if (action === "createDraft") await createDraftIssue(payload);
    else if (action === "updateDraft") await updateDraftIssue(payload);
    else if (action === "createNewIssue") await createIssue(payload);
    else if (action === "convertToNewIssue") await convertDraftToIssue(payload);

    clearDraftIssueLocalStorage();

    if (onSubmit) await onSubmit(payload);
  };

  if (!projects || projects.length === 0) return null;

  return (
    <>
      <Transition.Root show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-20" onClose={onClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-20">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 p-5 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                  <DraftIssueForm
                    isOpen={isOpen}
                    handleFormSubmit={handleFormSubmit}
                    initialData={initialData}
                    createMore={createMore}
                    setCreateMore={setCreateMore}
                    handleClose={onClose}
                    handleDiscard={onDiscard}
                    projectId={activeProject ?? ""}
                    setActiveProject={setActiveProject}
                    status={initialData?.id ? true : false}
                    user={user ?? undefined}
                    fieldsToShow={fieldsToShow}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
});