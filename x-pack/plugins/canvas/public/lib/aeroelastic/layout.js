/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { select } from './state';

import {
  actionEvent,
  cursorPosition,
  dragging,
  dragVector,
  gestureEnd,
  gestureState,
  metaHeld,
  mouseButton,
  mouseDowned,
  mouseIsDown,
  optionHeld,
  shiftHeld,
} from './gestures';

import {
  applyLocalTransforms,
  cascadeProperties,
  draggingShape,
  getAdHocChildrenAnnotations,
  getAlignmentGuideAnnotations,
  getAlterSnapGesture,
  getAnnotatedShapes,
  getConfiguration,
  getConstrainedShapesWithPreexistingAnnotations,
  getCursor,
  getDirectSelect,
  getDraggedPrimaryShape,
  getFocusedShape,
  getGroupAction,
  getGroupedSelectedPrimaryShapeIds,
  getGroupedSelectedShapeIds,
  getGroupedSelectedShapes,
  getGrouping,
  getGroupingTuple,
  getHoverAnnotations,
  getHoveredShape,
  getHoveredShapes,
  getMouseTransformGesture,
  getMouseTransformGesturePrev,
  getMouseTransformState,
  getNextScene,
  getNextShapes,
  getResizeManipulator,
  getRestateShapesEvent,
  getRotationAnnotations,
  getRotationTooltipAnnotation,
  getSelectedPrimaryShapeIds,
  getSelectedShapeObjects,
  getSelectedShapes,
  getSelectedShapesPrev,
  getSelectionState,
  getShapes,
  getSnappedShapes,
  getTransformIntents,
  resizeAnnotationsFunction,
} from './layout_functions';

import { primaryUpdate, scene } from './dag_start';

export const shapes = select(getShapes)(scene);

const configuration = select(getConfiguration)(scene);

const hoveredShapes = select(getHoveredShapes)(configuration, shapes, cursorPosition);

const hoveredShape = select(getHoveredShape)(hoveredShapes);

const draggedShape = select(draggingShape)(scene, hoveredShape, mouseIsDown, mouseDowned);

export const focusedShape = select(getFocusedShape)(draggedShape, hoveredShape);

const alterSnapGesture = select(getAlterSnapGesture)(metaHeld);

const multiselectModifier = shiftHeld; // todo abstract out keybindings

const mouseTransformGesturePrev = select(getMouseTransformGesturePrev)(scene);

const mouseTransformState = select(getMouseTransformState)(
  mouseTransformGesturePrev,
  dragging,
  dragVector
);

const mouseTransformGesture = select(getMouseTransformGesture)(mouseTransformState);

const transformGestures = mouseTransformGesture;

const restateShapesEvent = select(getRestateShapesEvent)(primaryUpdate);

// directSelect is an API entry point (via the `shapeSelect` action) that lets the client directly specify what thing
const directSelect = select(getDirectSelect)(primaryUpdate);

const selectedShapeObjects = select(getSelectedShapeObjects)(scene);

const selectedShapesPrev = select(getSelectedShapesPrev)(scene);

const selectionState = select(getSelectionState)(
  selectedShapesPrev,
  configuration,
  selectedShapeObjects,
  hoveredShapes,
  mouseButton,
  metaHeld,
  multiselectModifier,
  directSelect,
  shapes
);

const selectedShapes = select(getSelectedShapes)(selectionState);

const selectedPrimaryShapeIds = select(getSelectedPrimaryShapeIds)(selectedShapes); // fixme unify with contentShape

const symmetricManipulation = optionHeld; // as in comparable software applications, todo: make configurable

const resizeManipulator = select(getResizeManipulator)(configuration, symmetricManipulation);

const transformIntents = select(getTransformIntents)(
  configuration,
  transformGestures,
  selectedShapes,
  shapes,
  cursorPosition,
  alterSnapGesture,
  resizeManipulator
);

// "cumulative" is the effect of the ongoing interaction; "baseline" is sans "cumulative", plain "localTransformMatrix"

const nextShapes = select(getNextShapes)(shapes, restateShapesEvent);

const transformedShapes = select(applyLocalTransforms)(nextShapes, transformIntents);

const draggedPrimaryShape = select(getDraggedPrimaryShape)(shapes, draggedShape);

const alignmentGuideAnnotations = select(getAlignmentGuideAnnotations)(
  configuration,
  transformedShapes,
  draggedPrimaryShape,
  draggedShape
);

const hoverAnnotations = select(getHoverAnnotations)(
  configuration,
  select(h => h.slice(0, 1))(hoveredShapes), // todo remove this slicing when box select arrives
  selectedPrimaryShapeIds,
  draggedShape
);

// Once the interaction is over, ensure that the shape stays put where the constraint led it - distance is no longer relevant
// Note that this is what standard software (Adobe Illustrator, Google Slides, PowerPoint, Sketch etc.) do, but it's in
// stark contrast with the concept of StickyLines - whose central idea is that constraints remain applied until explicitly

const snappedShapes = select(getSnappedShapes)(
  configuration,
  transformedShapes,
  draggedShape,
  draggedPrimaryShape,
  alignmentGuideAnnotations,
  alterSnapGesture,
  symmetricManipulation
);

const constrainedShapesWithPreexistingAnnotations = select(
  getConstrainedShapesWithPreexistingAnnotations
)(snappedShapes, transformedShapes);

const rotationTooltipAnnotation = select(getRotationTooltipAnnotation)(
  configuration,
  draggedPrimaryShape,
  draggedShape,
  transformIntents,
  cursorPosition
);

const groupAction = select(getGroupAction)(actionEvent);

const groupingTuple = select(getGroupingTuple)(
  configuration,
  constrainedShapesWithPreexistingAnnotations,
  selectedShapes
);

const grouping = select(getGrouping)(
  configuration,
  constrainedShapesWithPreexistingAnnotations,
  selectedShapes,
  groupAction,
  groupingTuple
);

const groupedSelectedShapes = select(getGroupedSelectedShapes)(grouping);

const groupedSelectedShapeIds = select(getGroupedSelectedShapeIds)(groupedSelectedShapes);

const groupedSelectedPrimaryShapeIds = select(getGroupedSelectedPrimaryShapeIds)(
  groupedSelectedShapes
);

const adHocChildrenAnnotations = select(getAdHocChildrenAnnotations)(configuration, grouping);

const resizeAnnotations = select(resizeAnnotationsFunction)(configuration, grouping);

const rotationAnnotations = select(getRotationAnnotations)(configuration, grouping);

const annotatedShapes = select(getAnnotatedShapes)(
  grouping,
  alignmentGuideAnnotations,
  hoverAnnotations,
  rotationAnnotations,
  resizeAnnotations,
  rotationTooltipAnnotation,
  adHocChildrenAnnotations
);

const globalTransformShapes = select(cascadeProperties)(annotatedShapes);

const cursor = select(getCursor)(configuration, focusedShape, draggedPrimaryShape);

// this is the core scenegraph update invocation: upon new cursor position etc. emit the new scenegraph
// it's _the_ state representation (at a PoC level...) comprising of transient properties eg. draggedShape, and the
export const nextScene = select(getNextScene)(
  configuration,
  hoveredShape,
  groupedSelectedShapeIds,
  groupedSelectedPrimaryShapeIds,
  globalTransformShapes,
  gestureEnd,
  draggedShape,
  cursor,
  selectionState,
  mouseTransformState,
  groupedSelectedShapes,
  gestureState
);
