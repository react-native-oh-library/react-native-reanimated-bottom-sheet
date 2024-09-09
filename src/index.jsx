import React, {
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from 'react';
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import {
  withSpring,
  useAnimatedReaction,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');
const BottomSheetBehavior = forwardRef((props, ref) => {
  const {
    borderRadius = 10,
    enabledImperativeSnapping = true,
    enabledGestureInteraction = true,
    enabledContentGestureInteraction = true,
    enabledContentTapInteraction = true,
    enabledHeaderGestureInteraction = true,
    enabledBottomClamp = false,
    enabledBottomInitialAnimation = false,
    enabledInnerScrolling = true,
    overdragResistanceFactor = 0,
    callbackThreshold = 0.01,
    simultaneousHandlers,
    innerGestureHandlerRefs,
    initialSnap,
    springConfig,
    callbackNode
  } = props;

  useImperativeHandle(ref, () => ({
    snapTo,
  }));

  const snapPointsLen = props.snapPoints.length;
  const reverseSnapPoints = props.snapPoints.map(item => parseInt(item) <= 0 ? 0.01 : item).reverse();
  const getCurrentIndex = (i) => {
    if (!i) {
      return snapPointsLen - 1
    }
    return (snapPointsLen - 1) - i
  }
  // ref
  const bottomSheetRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(getCurrentIndex(initialSnap));
  const [snapPoints, setSnapPoints] = useState(reverseSnapPoints);
  const [enablePanDownToClose, setEnablePanDownToClose] = useState(false);
  const [animationConfigs, setAnimationConfigs] = useState(springConfig);
  const [contentPosition, setContentPosition] = useState(0);
  const [headerPosition, setHeaderPosition] = useState(0);
  const waitForRef = useRef(null);

  const snapTo = index => {
    if (!enabledImperativeSnapping) {
      return;
    }
    bottomSheetRef.current.snapToIndex(getCurrentIndex(index), animationConfigs);
  };

  useEffect(() => {
    setEnablePanDownToClose(reverseSnapPoints.includes(0.01))
  }, []);

  useEffect(() => {
    if (typeof props.contentPosition != "undefined") {
      props.contentPosition.value = contentPosition
    }
  }, [contentPosition])

  const changeHeaderPosition = (translateY) => {
    setHeaderPosition(SCREEN_HEIGHT - translateY)
  }

  useEffect(() => {
    if (typeof props.headerPosition != "undefined") {
      props.headerPosition.value = headerPosition
    }
  }, [headerPosition])


  // callbacks
  const handleSheetChanges = useCallback(index => {
  }, []);

  const handleOnAnimate = useCallback((fromIndex, toIndex) => {
    if (fromIndex - toIndex <= 0 && toIndex - (snapPoints.length - 1) != 0) {
      props.onOpenStart ? props.onOpenStart() : null;
    }

    if (fromIndex - toIndex > 0 && toIndex !== -1) {
      props.onCloseStart ? props.onCloseStart() : null;
    }
    
    if (toIndex - (props.snapPoints.length - 1) === 0) {
      props.onOpenEnd ? props.onOpenEnd() : null;
    }

    if (fromIndex - toIndex > 0 && (toIndex <= 0)) {
      props.onCloseEnd ? props.onCloseEnd() : null;
    }
  }, []);

  const animatedPosition = useSharedValue(SCREEN_HEIGHT);

  //动画属性动态监听
  useAnimatedReaction(
    () => {
      return animatedPosition.value;
    },
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        const _snapPoints = snapPoints.map(item => typeof item == 'string' ? (parseInt(item) * SCREEN_HEIGHT) / 100 : item);
        let translateY = currentValue;
        if (callbackNode) {
          const maxValue = Math.max(..._snapPoints)
          props.callbackNode.value = withSpring(1 - (translateY - maxValue > 0 ? maxValue / translateY : translateY / maxValue));
        }
        if (typeof props.headerPosition != "undefined") {
          runOnJS(changeHeaderPosition)(translateY);
        }
      }
    },
  );

  // renders
  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      waitFor={
        innerGestureHandlerRefs && innerGestureHandlerRefs.length >= 1
          ? innerGestureHandlerRefs[1]
          : waitForRef
      }
      index={enabledBottomClamp ? 0 : enabledBottomInitialAnimation ? (snapPoints.length - 1) - currentIndex :
        currentIndex}
      onChange={handleSheetChanges}
      onAnimate={handleOnAnimate}
      enablePanDownToClose={enablePanDownToClose}
      animatedPosition={animatedPosition}
      detached={false}
      handleIndicatorStyle={{ display: 'none', backgroundColor: 'blue' }}
      handleComponent={props.renderHeader ? props.renderHeader : null}
      backgroundStyle={{ backgroundColor: 'rgba(0,0,0,0)' }}
      // 内容是否禁用手势
      enableContentPanningGesture={
        enabledBottomClamp ? false :
          enabledGestureInteraction &&
          enabledContentGestureInteraction
      }
      // 头部是否禁用手势
      enableHandlePanningGesture={
        enabledBottomClamp ? false :
          enabledGestureInteraction &&
          enabledHeaderGestureInteraction
      }
      // 设置圆角
      style={{
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
        backgroundColor: 'white',
      }}
      simultaneousHandlers={simultaneousHandlers ? simultaneousHandlers : null}
      enableOverDrag={overdragResistanceFactor ? true : null}
      overdragResistanceFactor={overdragResistanceFactor}
      animationConfigs={animationConfigs}>
      {props.renderContent ? (
        enabledInnerScrolling ? (
          <BottomSheetScrollView onScroll={(v) => {
            if (typeof contentPosition != "undefined") {
              setContentPosition(v.nativeEvent.contentOffset.y)
            }
          }}>
            {props.renderContent && props.renderContent()}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView>
            {props.renderContent && props.renderContent()}
          </BottomSheetView>
        )
      ) : null}

    </BottomSheet >
  );
});

export default BottomSheetBehavior;