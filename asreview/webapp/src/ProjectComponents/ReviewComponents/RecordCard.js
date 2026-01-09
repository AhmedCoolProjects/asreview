import { Link as LinkIcon } from "@mui/icons-material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Divider,
  Fade,
  Grid2 as Grid,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";

import { StyledIconButton } from "StyledComponents/StyledButton";
import { useToggle } from "hooks/useToggle";
import { DOIIcon } from "icons";
import { RecordCardLabeler, RecordCardModelTraining } from ".";

import { fontSizeOptions } from "globals.js";

const RecordCardContent = ({
  record,
  fontSize,
  collapseAbstract,
  highlights,
  setHighlights,
  allowHighlighting = true,
}) => {
  const [readMoreOpen, toggleReadMore] = useToggle();
  const [highlightMode, setHighlightMode] = React.useState(null); // 'positive', 'negative', null

  const handleHighlightModeChange = (event, newMode) => {
    setHighlightMode(newMode);
  };

  const handleMouseUp = (event) => {
    if (!highlightMode || !allowHighlighting) return;

    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;

    const container = event.currentTarget;
    let range = selection.getRangeAt(0);

    if (!container.contains(range.commonAncestorContainer)) return;

    const getGlobalOffset = (node, offset) => {
      let globalOffset = offset;
      let set = node;
      while (set && set !== container) {
        if (set.previousSibling) {
          set = set.previousSibling;
          globalOffset += set.textContent.length;
        } else {
          set = set.parentNode;
        }
      }
      return globalOffset;
    };

    const startNode = range.startContainer;
    const endNode = range.endContainer;

    const idx1 = getGlobalOffset(startNode, range.startOffset);
    const idx2 = getGlobalOffset(endNode, range.endOffset);

    const start = Math.min(idx1, idx2);
    const end = Math.max(idx1, idx2);

    const fullText = container.textContent;
    const textToHighlight = fullText.substring(start, end);

    if (!textToHighlight.trim()) {
      selection.removeAllRanges();
      return;
    }

    const newH = { start, end, type: highlightMode };
    let nextHighlights = [...highlights];

    if (highlightMode === "eraser") {
      // Erase Mode: Subtract newH from existing highlights
      nextHighlights = nextHighlights.flatMap((h) => {
        // 1. No overlap
        if (h.end <= newH.start || h.start >= newH.end) return [h];

        const fragments = [];
        // 2. Left Fragment (if exists)
        if (h.start < newH.start) {
          fragments.push({
            ...h,
            end: newH.start,
            text: fullText.substring(h.start, newH.start),
          });
        }
        // 3. Right Fragment (if exists)
        if (h.end > newH.end) {
          fragments.push({
            ...h,
            start: newH.end,
            text: fullText.substring(newH.end, h.end),
          });
        }
        return fragments;
      });
    } else {
      // Paint Mode: Merge overlaps of SAME type
      // First, check if we overlap with DIFFERENT type -> If so, should we overwrite?
      // Let's decide: "Paint over" means overwrite.
      // So first, ERASE the range from ALL highlights (like we are painting fresh),
      // THEN merge with same-colored ones. This creates a clean "Top Layer" effect.

      // Step 1: Subtract this range from ALL existing highlights (overwrite behavior)
      nextHighlights = nextHighlights.flatMap((h) => {
        if (h.end <= newH.start || h.start >= newH.end) return [h];
        // Overlap found
        const fragments = [];
        if (h.start < newH.start) {
          fragments.push({
            ...h,
            end: newH.start,
            text: fullText.substring(h.start, newH.start),
          });
        }
        if (h.end > newH.end) {
          fragments.push({
            ...h,
            start: newH.end,
            text: fullText.substring(newH.end, h.end),
          });
        }
        return fragments;
      });

      // Step 2: Add the new highlight
      // Step 3: Merge connecting/overlapping highlights of the SAME type
      // Ideally, since we just cut everything else away, we only need to check for adjacent same-type segments
      // kept from Step 1.

      // Let's assume we just add it, and then run a global merge pass for clean state.
      nextHighlights.push(newH);

      // Merge Pass (Sort by start, then merge adjacent of same type)
      nextHighlights.sort((a, b) => a.start - b.start);

      const merged = [];
      if (nextHighlights.length > 0) {
        let current = nextHighlights[0];
        for (let i = 1; i < nextHighlights.length; i++) {
          const next = nextHighlights[i];
          if (next.type === current.type && next.start <= current.end) {
            // Merge
            current.end = Math.max(current.end, next.end);
            current.text = fullText.substring(current.start, current.end);
          } else {
            merged.push(current);
            current = next;
          }
        }
        merged.push(current);
        nextHighlights = merged;
      }
    }

    setHighlights(nextHighlights);
    selection.removeAllRanges();
  };

  // Calculate Score
  const score = React.useMemo(() => {
    return highlights.reduce((acc, curr) => {
      // Roughly score by character length or count?
      // User asked for "Frequency". Let's say 1 highlight block = 1 point?
      // Or weighted by length? "frequency of how much this record is relevant" implies magnitude.
      // Let's do: 1 point per highlighted character? Or just simple block count.
      // Let's stick to block count for now as it's cleaner numbers.
      return acc + (curr.type === "positive" ? 1 : -1);
    }, 0);
  }, [highlights]);

  // Custom renderer for the abstract
  const renderAbstract = () => {
    const text =
      readMoreOpen || !collapseAbstract || record.abstract?.length <= 500
        ? record.abstract
        : record.abstract?.substring(0, 500);

    if (!text) return "No abstract available";
    if (highlights.length === 0) return text;

    let nodes = [];
    let lastIndex = 0;

    // Sort by start
    const sortedHighlights = [...highlights]
      .filter((h) => h.end <= text.length)
      .sort((a, b) => a.start - b.start);

    sortedHighlights.forEach((h, i) => {
      // With our logic, there should be NO overlaps in the state now.
      // Just render sequentially.

      if (h.start > lastIndex) {
        nodes.push(text.substring(lastIndex, h.start));
      }

      nodes.push(
        <Box
          component="span"
          key={i}
          sx={{
            backgroundColor: h.type === "positive" ? "#a5d6a7" : "#ef9a9a",
            padding: "0 0px", // Remove padding to make merge look seamless
            borderRadius: "0px",
            cursor: "pointer",
            // Add border radius to outer edges of the block?
            // Too complex for simple loop, flat color is fine.
          }}
          title={h.type}
        >
          {text.substring(h.start, h.end)}
        </Box>,
      );
      lastIndex = h.end;
    });

    if (lastIndex < text.length) {
      nodes.push(text.substring(lastIndex));
    }

    return nodes;
  };

  return (
    <CardContent aria-label="record title abstract" sx={{ m: 1 }}>
      <Stack spacing={2}>
        {/* Title */}
        <Typography
          variant={"h5"}
          sx={(theme) => ({
            fontWeight: theme.typography.fontWeightMedium,
            lineHeight: 1.4,
          })}
        >
          {!(record.title === "" || record.title === null) ? (
            record.title
          ) : (
            <Box
              className={"fontSize" + fontSizeOptions[fontSize]}
              fontStyle="italic"
            >
              No title available
            </Box>
          )}
        </Typography>
        <Divider />

        {/* Metadata & Tools Row */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1}>
            {!(record.doi === undefined || record.doi === null) && (
              <Tooltip title="Open DOI">
                <StyledIconButton
                  className="record-card-icon"
                  href={"https://doi.org/" + record.doi}
                  target="_blank"
                  rel="noreferrer"
                >
                  <DOIIcon />
                </StyledIconButton>
              </Tooltip>
            )}
            {!(record.url === undefined || record.url === null) && (
              <Tooltip title="Open URL">
                <StyledIconButton
                  className="record-card-icon"
                  href={record.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <LinkIcon />
                </StyledIconButton>
              </Tooltip>
            )}
          </Stack>

          {/* Highlighter Tools */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ bgcolor: "rgba(0,0,0,0.04)", p: 0.5, borderRadius: 1 }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: "bold",
                color:
                  score > 0 ? "green" : score < 0 ? "red" : "text.secondary",
              }}
            >
              Score: {score > 0 ? "+" : ""}
              {score}
            </Typography>
            <Divider orientation="vertical" flexItem />
            {allowHighlighting && (
              <Grid container spacing={0.5}>
                <Grid item>
                  <Box
                    component="button"
                    onClick={() =>
                      setHighlightMode(
                        highlightMode === "positive" ? null : "positive",
                      )
                    }
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: "2px solid",
                      borderColor:
                        highlightMode === "positive" ? "green" : "transparent",
                      bgcolor: "#4caf50",
                      cursor: "pointer",
                      "&:hover": { opacity: 0.8 },
                    }}
                    title="Positive Highlighter"
                  />
                </Grid>
                <Grid item>
                  <Box
                    component="button"
                    onClick={() =>
                      setHighlightMode(
                        highlightMode === "negative" ? null : "negative",
                      )
                    }
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: "2px solid",
                      borderColor:
                        highlightMode === "negative" ? "red" : "transparent",
                      bgcolor: "#f44336",
                      cursor: "pointer",
                      "&:hover": { opacity: 0.8 },
                    }}
                    title="Negative Highlighter"
                  />
                </Grid>
                <Grid item>
                  {/* Eraser Tool */}
                  <Box
                    component="button"
                    onClick={() =>
                      setHighlightMode(
                        highlightMode === "eraser" ? null : "eraser",
                      )
                    }
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: "2px solid",
                      borderColor:
                        highlightMode === "eraser" ? "#666" : "transparent",
                      bgcolor: "#e0e0e0",
                      color: "#333",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      "&:hover": { opacity: 0.8 },
                      fontSize: "14px",
                    }}
                    title="Eraser"
                  >
                    x
                  </Box>
                </Grid>
              </Grid>
            )}
          </Stack>
        </Stack>

        <Box>
          {(record.abstract === "" || record.abstract === null) && (
            <Typography
              className={"fontSize" + fontSize}
              variant="body1"
              sx={{ fontStyle: "italic", textAlign: "justify" }}
            >
              No abstract available
            </Typography>
          )}

          <Typography
            className={"fontSize" + fontSizeOptions[fontSize]}
            variant="body1"
            onMouseUp={handleMouseUp}
            sx={{
              whiteSpace: "pre-line",
              textAlign: "justify",
              hyphens: "auto",
              lineHeight: 1.6,
              cursor: highlightMode ? "text" : "inherit",
            }}
          >
            {/* Abstract Rendering with Highlights */}
            {!(record.abstract === "" || record.abstract === null) && (
              <>
                {renderAbstract()}

                {/* Read More / Less Toggle */}
                {collapseAbstract && record.abstract.length > 500 && (
                  <Button
                    onClick={toggleReadMore}
                    startIcon={
                      readMoreOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />
                    }
                    color="primary"
                    sx={{ textTransform: "none", ml: 1 }}
                  >
                    {readMoreOpen ? "show less" : "show more"}
                  </Button>
                )}
              </>
            )}
          </Typography>
        </Box>
        {record.keywords && (
          <Box sx={{ pt: 1 }}>
            <Typography sx={{ color: "text.secondary", fontWeight: "bold" }}>
              {record.keywords.map((keyword, index) => (
                <span key={index}>
                  {index > 0 && " • "}
                  {keyword}
                </span>
              ))}
            </Typography>
          </Box>
        )}
      </Stack>
    </CardContent>
  );
};

const RecordCard = ({
  project_id,
  record,
  afterDecision = null,
  retrainAfterDecision = true,
  showBorder = true,
  fontSize = 1,
  modelLogLevel = "warning",
  showNotes = true,
  collapseAbstract = false,
  hotkeys = false,
  transitionType = "fade",
  transitionSpeed = { enter: 500, exit: 100 },
  landscape = false,
  changeDecision = true,
  allowHighlighting = true,
}) => {
  const [open, setOpen] = React.useState(true);
  const [highlights, setHighlights] = React.useState(
    record?.state?.highlights || [],
  );

  const styledRepoCard = (
    <Box>
      <RecordCardModelTraining
        key={"record-card-model-" + project_id + "-" + record?.record_id}
        record={record}
        modelLogLevel={modelLogLevel}
        sx={{ mb: 3 }}
      />
      <Card
        elevation={showBorder ? 4 : 0}
        sx={(theme) => ({
          bgcolor: theme.palette.background.record,
          borderRadius: !showBorder ? 0 : undefined,
        })}
      >
        <Grid
          container
          columns={5}
          sx={{ alignItems: "stretch" }}
          // divider={<Divider orientation="vertical" flexItem />}
        >
          <Grid size={landscape ? 3 : 5}>
            <RecordCardContent
              record={record}
              fontSize={fontSize}
              collapseAbstract={collapseAbstract}
              highlights={highlights}
              setHighlights={setHighlights}
              allowHighlighting={allowHighlighting}
              changeDecision={changeDecision}
            />
          </Grid>
          <Grid size={landscape ? 2 : 5}>
            <RecordCardLabeler
              key={
                "record-card-labeler-" +
                project_id +
                "-" +
                record?.record_id +
                "-" +
                record?.state?.note
              }
              project_id={project_id}
              record_id={record.record_id}
              label={record.state?.label}
              labelFromDataset={record.included}
              onDecisionClose={
                transitionType ? () => setOpen(false) : afterDecision
              }
              retrainAfterDecision={retrainAfterDecision}
              note={record.state?.note}
              labelTime={record.state?.time}
              user={record.state?.user}
              showNotes={showNotes}
              tagsForm={record.tags_form}
              tagValues={record.state?.tags}
              landscape={landscape}
              hotkeys={hotkeys}
              changeDecision={changeDecision}
              highlights={highlights}
            />
          </Grid>
        </Grid>
      </Card>
    </Box>
  );

  if (transitionType === "fade") {
    return (
      <Fade
        in={open}
        timeout={transitionSpeed}
        onExited={afterDecision}
        unmountOnExit
      >
        {styledRepoCard}
      </Fade>
    );
  } else if (transitionType === "collapse") {
    return (
      <Collapse
        in={open}
        timeout={transitionSpeed}
        onExited={afterDecision}
        unmountOnExit
      >
        {styledRepoCard}
      </Collapse>
    );
  } else {
    return styledRepoCard;
  }
};

export default RecordCard;
