// @flow
import React from 'react';
import PropTypes from 'prop-types';
import mapValues from 'lodash.mapvalues';
import { NativeModulesProxy, requireNativeViewManager } from 'expo-core';
import { findNodeHandle, ViewPropTypes, Platform } from 'react-native';

type PictureOptions = {
  quality?: number,
};

type RecordingOptions = {
  maxDuration?: number,
  maxFileSize?: number,
  quality?: number | string,
};

type EventCallbackArgumentsType = {
  nativeEvent: Object,
};

type MountErrorNativeEventType = {
  message: string,
};

type PropsType = ViewPropTypes & {
  zoom?: number,
  ratio?: string,
  focusDepth?: number,
  type?: number | string,
  onCameraReady?: Function,
  onBarCodeRead?: Function,
  flashMode?: number | string,
  barCodeTypes?: Array<string | number>,
  whiteBalance?: number | string,
  autoFocus?: string | boolean | number,
  faceDetectionSettings?: {},
  onMountError?: MountErrorNativeEventType => void,
  onFacesDetected?: ({ faces: Array<*> }) => void,
};

const CameraManager: Object =
  NativeModulesProxy.ExponentCameraManager || NativeModulesProxy.ExponentCameraModule;

const EventThrottleMs = 500;

export default class Camera extends React.Component<PropsType> {
  static Constants = {
    Type: CameraManager.Type,
    FlashMode: CameraManager.FlashMode,
    AutoFocus: CameraManager.AutoFocus,
    WhiteBalance: CameraManager.WhiteBalance,
    VideoQuality: CameraManager.VideoQuality,
    BarCodeType: CameraManager.BarCodeType,
  };

  // Values under keys from this object will be transformed to native options
  static ConversionTables = {
    type: CameraManager.Type,
    flashMode: CameraManager.FlashMode,
    autoFocus: CameraManager.AutoFocus,
    whiteBalance: CameraManager.WhiteBalance,
  };

  static propTypes = {
    ...ViewPropTypes,
    zoom: PropTypes.number,
    ratio: PropTypes.string,
    focusDepth: PropTypes.number,
    onMountError: PropTypes.func,
    onCameraReady: PropTypes.func,
    useCamera2Api: PropTypes.bool,
    onBarCodeRead: PropTypes.func,
    onFacesDetected: PropTypes.func,
    faceDetectorSettings: PropTypes.object,
    barCodeTypes: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    type: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    flashMode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    whiteBalance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    autoFocus: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  };

  static defaultProps: Object = {
    zoom: 0,
    ratio: '4:3',
    focusDepth: 0,
    faceDetectorSettings: {},
    type: CameraManager.Type.back,
    autoFocus: CameraManager.AutoFocus.on,
    flashMode: CameraManager.FlashMode.off,
    whiteBalance: CameraManager.WhiteBalance.auto,
    barCodeTypes: Object.values(CameraManager.BarCodeType),
  };

  _cameraRef: ?Object;
  _cameraHandle: ?number;
  _lastEvents: { [string]: string };
  _lastEventsTimes: { [string]: Date };

  constructor(props: PropsType) {
    super(props);
    this._lastEvents = {};
    this._lastEventsTimes = {};
  }

  async takePictureAsync(options?: PictureOptions) {
    if (!options) {
      options = {};
    }
    if (!options.quality) {
      options.quality = 1;
    }
    return await CameraManager.takePicture(options, this._cameraHandle);
  }

  async getSupportedRatiosAsync() {
    if (Platform.OS === 'android') {
      return await CameraManager.getSupportedRatios(this._cameraHandle);
    } else {
      throw new Error('Ratio is not supported on iOS');
    }
  }

  async recordAsync(options?: RecordingOptions) {
    if (!options || typeof options !== 'object') {
      options = {};
    } else if (typeof options.quality === 'string') {
      options.quality = Camera.Constants.VideoQuality[options.quality];
    }
    return await CameraManager.record(options, this._cameraHandle);
  }

  stopRecording() {
    CameraManager.stopRecording(this._cameraHandle);
  }

  _onCameraReady = () => {
    if (this.props.onCameraReady) {
      this.props.onCameraReady();
    }
  };

  _onMountError = ({ nativeEvent }: { nativeEvent: MountErrorNativeEventType }) => {
    if (this.props.onMountError) {
      this.props.onMountError(nativeEvent);
    }
  };

  _onObjectDetected = (callback: ?Function) => ({ nativeEvent }: EventCallbackArgumentsType) => {
    const { type } = nativeEvent;
    if (
      this._lastEvents[type] &&
      this._lastEventsTimes[type] &&
      JSON.stringify(nativeEvent) === this._lastEvents[type] &&
      new Date() - this._lastEventsTimes[type] < EventThrottleMs
    ) {
      return;
    }

    if (callback) {
      callback(nativeEvent);
      this._lastEventsTimes[type] = new Date();
      this._lastEvents[type] = JSON.stringify(nativeEvent);
    }
  };

  _setReference = (ref: ?Object) => {
    if (ref) {
      this._cameraRef = ref;
      this._cameraHandle = findNodeHandle(ref);
    } else {
      this._cameraRef = null;
      this._cameraHandle = null;
    }
  };

  render() {
    const nativeProps = this._convertNativeProps(this.props);

    return (
      <ExponentCamera
        {...nativeProps}
        ref={this._setReference}
        onCameraReady={this._onCameraReady}
        onMountError={this._onMountError}
        onBarCodeRead={this._onObjectDetected(this.props.onBarCodeRead)}
        onFacesDetected={this._onObjectDetected(this.props.onFacesDetected)}
      />
    );
  }

  _convertNativeProps(props: PropsType) {
    const newProps = mapValues(props, this._convertProp);

    if (props.onBarCodeRead) {
      newProps.barCodeScannerEnabled = true;
    }

    if (props.onFacesDetected) {
      newProps.faceDetectorEnabled = true;
    }

    if (Platform.OS === 'ios') {
      delete newProps.ratio;
    }

    return newProps;
  }

  _convertProp(value: *, key: string): * {
    if (typeof value === 'string' && Camera.ConversionTables[key]) {
      return Camera.ConversionTables[key][value];
    }

    return value;
  }
}

export const Constants = Camera.Constants;

const ExponentCamera = requireNativeViewManager('ExponentCamera', Camera);
