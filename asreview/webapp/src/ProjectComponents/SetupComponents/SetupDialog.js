import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Input,
  Snackbar,
  TextField,
  Tooltip,
} from "@mui/material";
import * as React from "react";

import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";

import useMediaQuery from "@mui/material/useMediaQuery";

import {
  DatasetCard,
  ModelCard,
  PriorCard,
  TagCard,
} from "ProjectComponents/SetupComponents";
import { ProjectAPI } from "api";
import { ProjectContext } from "context/ProjectContext";
import { projectModes, projectStatuses } from "globals.js";
import { Save, Edit } from "@mui/icons-material";

const DialogProjectName = ({ project_id, dataset_name }) => {
  const [state, setState] = React.useState({
    name: dataset_name,
    edit: false,
  });

  const { isLoading, mutate } = useMutation(ProjectAPI.mutateInfo, {
    mutationKey: ["mutateInfo"],
    onSuccess: (data) => {
      setState({
        name: data?.name,
        edit: false,
      });
    },
  });

  return (
    <DialogTitle>
      Start project:{" "}
      {!state.edit && (
        <>
          {state.name}
          <Tooltip title={"Edit project name"}>
            <IconButton
              onClick={() => {
                setState({
                  ...state,
                  edit: !state.edit,
                });
              }}
            >
              <Edit />
            </IconButton>
          </Tooltip>
        </>
      )}
      {state.edit && (
        <>
          <Input
            value={state.name}
            onChange={(e) => {
              setState({
                ...state,
                name: e.target.value,
              });
            }}
            disabled={isLoading}
            sx={{ width: "50%" }}
            autoFocus
          />
          <Tooltip title={"Save project name"}>
            <IconButton
              onClick={() => {
                mutate({ project_id: project_id, title: state.name });
              }}
              loading={isLoading}
            >
              <Save />
            </IconButton>
          </Tooltip>
        </>
      )}
    </DialogTitle>
  );
};

const DialogProjectDescription = ({ project_id, description }) => {
  const [state, setState] = React.useState({
    description: description || "",
    edit: false,
  });

  const { isLoading, mutate } = useMutation(ProjectAPI.mutateInfo, {
    mutationKey: ["mutateInfoDescription"],
    onSuccess: (data) => {
      setState({
        description: data?.description || "",
        edit: false,
      });
    },
  });

  return (
    <Box sx={{ px: 3, pb: 2 }}>
      {!state.edit && (
        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                fontSize: "0.875rem",
                color: "text.secondary",
                mb: 0.5,
              }}
            >
              Description
            </Box>
            <Box sx={{ fontSize: "0.95rem", minHeight: 24 }}>
              {state.description || (
                <Box
                  component="span"
                  sx={{ fontStyle: "italic", color: "text.disabled" }}
                >
                  Add a description (e.g., search query, source, date range)
                </Box>
              )}
            </Box>
          </Box>
          <Tooltip title={"Edit description"}>
            <IconButton
              onClick={() => {
                setState({
                  ...state,
                  edit: true,
                });
              }}
              size="small"
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      {state.edit && (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <TextField
            value={state.description}
            onChange={(e) => {
              setState({
                ...state,
                description: e.target.value,
              });
            }}
            disabled={isLoading}
            placeholder="Describe how you obtained this dataset (e.g., search query, platform, date range, source titles)"
            multiline
            minRows={2}
            maxRows={4}
            fullWidth
            size="small"
            autoFocus
          />
          <Tooltip title={"Save description"}>
            <IconButton
              onClick={() => {
                mutate({
                  project_id: project_id,
                  description: state.description,
                });
              }}
              disabled={isLoading}
            >
              <Save />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

const SetupDialog = ({ project_id, mode, open, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));

  // state management
  const [showSettings, setShowSettings] = React.useState(false);
  const [feedbackBar, setFeedbackBar] = React.useState(null);
  const [simulationStarted, setSimulationStarted] = React.useState(false);

  const { data } = useQuery(
    ["fetchProject", { project_id: project_id }],
    ProjectAPI.fetchInfo,
    {
      enabled: open,
      refetchOnWindowFocus: false,
    },
  );

  const { mutate: setStatus } = useMutation(ProjectAPI.mutateReviewStatus, {
    mutationKey: ["mutateReviewStatus"],
    onSuccess: () => {
      if (mode === projectModes.SIMULATION) {
        setSimulationStarted(true);
        onClose();
      } else {
        navigate(`/reviews/${data?.id}/reviewer`);
      }
    },
  });

  return (
    <>
      <Dialog
        aria-label="project setup"
        open={open}
        fullScreen={fullScreen}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            height: !fullScreen ? "calc(100% - 64px)" : "100%",
            bgcolor: "background.default",
          },
        }}
        onClose={onClose}
        TransitionProps={{
          onExited: () => {
            queryClient.invalidateQueries("fetchProjects");

            setFeedbackBar(
              simulationStarted
                ? "Simulation started"
                : `Your project has been saved as draft`,
            );
            setSimulationStarted(false);

            setShowSettings(false);
          },
        }}
        closeAfterTransition={false}
      >
        {data && (
          <ProjectContext.Provider value={data.id}>
            <DialogProjectName project_id={data.id} dataset_name={data.name} />
            <DialogProjectDescription
              project_id={data.id}
              description={data.description}
            />
            <DialogContent>
              {mode === projectModes.SIMULATION ? (
                <>
                  <Box sx={{ mt: 3 }}>
                    <DatasetCard
                      project_id={data?.id}
                      onResetDataset={onClose}
                      hideLabeledInfo={true}
                    />
                  </Box>
                  <Box sx={{ my: 3 }}>
                    <ModelCard mode={mode} />
                  </Box>
                  <Box sx={{ my: 3 }}>
                    <PriorCard mode={mode} />
                  </Box>
                </>
              ) : (
                <>
                  <Collapse in={!showSettings}>
                    <Box sx={{ mt: 3 }}>
                      <DatasetCard
                        project_id={data?.id}
                        onResetDataset={onClose}
                        hideLabeledInfo={false}
                      />
                    </Box>
                  </Collapse>

                  <Box sx={{ textAlign: "center", my: 2 }}>
                    <Button onClick={() => setShowSettings(!showSettings)}>
                      {showSettings ? "Show dataset" : "Show options"}
                    </Button>
                  </Box>
                  <Collapse in={showSettings} mountOnEnter>
                    <Box sx={{ mb: 3 }}>
                      <TagCard
                        project_id={data?.id}
                        mobileScreen={fullScreen}
                      />
                    </Box>
                    <Box sx={{ my: 3 }}>
                      <ModelCard mode={mode} />
                    </Box>
                    <Box sx={{ my: 3 }}>
                      <PriorCard mode={mode} />
                    </Box>
                  </Collapse>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                onClick={() => {
                  setSimulationStarted(false);
                  if (mode === projectModes.SIMULATION) {
                    setSimulationStarted(true);
                  }
                  setStatus({
                    project_id: data?.id,
                    status: projectStatuses.REVIEW,
                  });
                }}
              >
                {mode === projectModes.SIMULATION ? "Simulate" : "Screen"}
              </Button>
            </DialogActions>
          </ProjectContext.Provider>
        )}
      </Dialog>
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        open={feedbackBar !== null}
        autoHideDuration={5000}
        onClose={() => setFeedbackBar(null)}
        message={feedbackBar}
      />
    </>
  );
};

export default SetupDialog;
