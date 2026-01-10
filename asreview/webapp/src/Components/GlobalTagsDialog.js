import React from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { ProjectAPI } from "api";
import { useMutation, useQuery, useQueryClient } from "react-query";

import { Add, Delete } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { useToggle } from "hooks/useToggle";
import { TypographySubtitle1Medium } from "StyledComponents/StyledTypography";

function labelToExport(label) {
  return label
    .toLowerCase()
    .replaceAll(/\s+/g, "_")
    .replaceAll(/[^a-z0-9_]/g, "");
}

const MutateGlobalGroupDialog = ({ open, onClose, group = null }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const smallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [state, setState] = React.useState(
    group || {
      label: "",
      export: "",
      values: [
        { label: "", export: "" },
        { label: "", export: "" },
        { label: "", export: "" },
      ],
    },
  );

  const { mutate: createTagGroup, error: createError } = useMutation(
    ProjectAPI.createGlobalTagGroup,
    {
      mutationKey: ["createGlobalTagGroup"],
      onSuccess: () => {
        queryClient.invalidateQueries(["fetchGlobalTags"]);
        closeDialog();
      },
    },
  );

  const { mutate: mutateTagGroup, error: mutateError } = useMutation(
    ProjectAPI.mutateGlobalTagGroup,
    {
      mutationKey: ["mutateGlobalTagGroup"],
      onSuccess: () => {
        queryClient.invalidateQueries(["fetchGlobalTags"]);
        closeDialog();
      },
    },
  );

  const handleGroupLabelChange = (e) => {
    setState((prev) => ({
      ...prev,
      label: e.target.value,
      export: labelToExport(e.target.value),
    }));
  };

  const handleGroupExportChange = (e) => {
    setState((prev) => ({
      ...prev,
      export: e.target.value,
    }));
  };

  const handleTagLabelChange = (index, e) => {
    setState((prev) => ({
      ...prev,
      values: prev.values.map((tag, i) =>
        i === index
          ? {
              ...tag,
              label: e.target.value,
              export: labelToExport(e.target.value),
            }
          : tag,
      ),
    }));
  };

  const handleTagExportChange = (index, e) => {
    setState((prev) => ({
      ...prev,
      values: prev.values.map((tag, i) =>
        i === index ? { ...tag, export: e.target.value } : tag,
      ),
    }));
  };

  const addTag = () => {
    setState((prev) => ({
      ...prev,
      values: [...prev.values, { label: "", export: "" }],
    }));
  };

  const closeDialog = () => {
    if (group == null) {
      setState({
        label: "",
        export: "",
        values: [
          { label: "", export: "" },
          { label: "", export: "" },
          { label: "", export: "" },
        ],
      });
    }
    onClose();
  };

  const onSave = () => {
    if (group !== null) {
      mutateTagGroup({
        group: {
          ...state,
          values: state.values.filter((tag) => tag.label && tag.export),
        },
      });
    } else {
      createTagGroup({
        group: {
          ...state,
          values: state.values.filter((tag) => tag.label && tag.export),
        },
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      fullScreen={smallScreen}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {group !== null ? "Edit global tag group" : "Add global tag group"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <TypographySubtitle1Medium>Group</TypographySubtitle1Medium>
          <Stack direction="row" spacing={3}>
            <TextField
              fullWidth
              id="group-label"
              label="Label"
              value={state.label}
              onChange={handleGroupLabelChange}
              helperText=" "
            />
            <TextField
              fullWidth
              id="group-id"
              label="Export name"
              value={state.export}
              onChange={handleGroupExportChange}
            />
          </Stack>
        </Stack>
        <Stack spacing={3}>
          <TypographySubtitle1Medium>Tags</TypographySubtitle1Medium>
          {state.values.map((tag, index) => (
            <Stack direction="row" spacing={3} key={index}>
              <TextField
                fullWidth
                id={`tag-label-${index}`}
                label="Label"
                value={tag.label}
                onChange={(e) => handleTagLabelChange(index, e)}
              />
              <TextField
                fullWidth
                id={`tag-id-${index}`}
                label="Export name"
                value={tag.export}
                onChange={(e) => handleTagExportChange(index, e)}
              />
            </Stack>
          ))}
        </Stack>
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="baseline"
          spacing={2}
        >
          <Tooltip title="Add tag">
            <IconButton aria-label="add tag" onClick={addTag}>
              <Add />
            </IconButton>
          </Tooltip>
        </Stack>

        {mutateError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {mutateError?.message}
          </Alert>
        )}
        {createError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {createError?.message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>Cancel</Button>
        <Button
          onClick={onSave}
          disabled={
            !state.label ||
            !state.export ||
            state.values.filter((tag) => tag.label && tag.export).length === 0
          }
        >
          {group !== null ? "Save" : "Create Group"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const GlobalGroup = ({ group }) => {
  const [dialogOpen, toggleDialogOpen] = useToggle();
  const queryClient = useQueryClient();

  const { mutate: deleteGroup } = useMutation(ProjectAPI.deleteGlobalTagGroup, {
    mutationKey: ["deleteGlobalTagGroup"],
    onSuccess: () => {
      queryClient.invalidateQueries(["fetchGlobalTags"]);
    },
  });

  return (
    <Card sx={{ mb: 2, bgcolor: "background.default" }}>
      <CardHeader
        title={group.label}
        action={
          <Stack direction="row">
            <Tooltip title="Edit Group">
              <IconButton onClick={toggleDialogOpen}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Group">
              <IconButton
                onClick={() => deleteGroup({ group_id: group.id })}
                color="error"
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      />
      <CardContent>
        {group.values.map((t, index) => (
          <Chip key={index} label={`${t.label} (${t.export})`} sx={{ m: 1 }} />
        ))}
      </CardContent>
      <MutateGlobalGroupDialog
        key={group.id}
        open={dialogOpen}
        onClose={toggleDialogOpen}
        group={group}
      />
    </Card>
  );
};

const GlobalTagsDialog = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [createDialogOpen, toggleCreateDialogOpen] = useToggle();

  const { data, isLoading } = useQuery(
    ["fetchGlobalTags"],
    ProjectAPI.fetchGlobalTags,
    {
      refetchOnWindowFocus: false,
    },
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          height: !fullScreen ? "calc(100% - 64px)" : "100%",
          bgcolor: "background.default",
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocalOfferOutlinedIcon />
          Global Tags
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Create tag groups that are available across all projects
        </Typography>
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Skeleton variant="rectangular" height={120} />
        ) : (
          <>
            {data?.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No global tags yet. Create your first tag group to get started.
              </Alert>
            )}
            {data?.map((group, index) => (
              <GlobalGroup key={index} group={group} />
            ))}
          </>
        )}

        <Box sx={{ mt: 3 }}>
          <MutateGlobalGroupDialog
            open={createDialogOpen}
            onClose={toggleCreateDialogOpen}
          />
          <Button
            onClick={toggleCreateDialogOpen}
            variant="contained"
            startIcon={<Add />}
          >
            Add Tag Group
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GlobalTagsDialog;
